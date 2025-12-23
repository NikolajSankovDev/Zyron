import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { addMinutes } from "date-fns";
import { safePrismaQuery } from "@/lib/prisma";

export interface CreateAppointmentData {
  customerId: string;
  barberId: string;
  startTime: Date;
  serviceIds: number[];
}

/**
 * Create a new appointment with services
 * Validates slot availability and prevents double bookings
 */
export async function createAppointment(data: CreateAppointmentData) {
  const { customerId, barberId, startTime, serviceIds } = data;

  // Validate services exist and are active
  const services = await safePrismaQuery(
    async () => {
      if (!prisma) throw new Error("Database not available");
      return await prisma.service.findMany({
        where: {
          id: { in: serviceIds },
          active: true,
        },
      });
    },
    []
  );

  if (services.length !== serviceIds.length) {
    throw new Error("One or more services are invalid or inactive");
  }

  // Calculate total duration and price
  const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalPrice = services.reduce(
    (sum, s) => sum + Number(s.basePrice),
    0
  );

  const endTime = addMinutes(startTime, totalDuration);

  // Check for conflicts (transactional)
  return await safePrismaQuery(
    async () => {
      if (!prisma) throw new Error("Database not available");
      
      return await prisma.$transaction(async (tx) => {
        // Check if slot is still available
        // Allow appointments that start exactly when a previous one ends (back-to-back)
        const conflictingAppointment = await tx.appointment.findFirst({
          where: {
            barberId,
            startTime: {
              lt: endTime,  // Existing appointment starts before new appointment ends
            },
            endTime: {
              gt: startTime,  // Existing appointment ends after new appointment starts
            },
            status: {
              not: "CANCELED",
            },
          },
        });

        if (conflictingAppointment) {
          throw new Error("Time slot is no longer available");
        }

        // Create appointment
        const appointment = await tx.appointment.create({
          data: {
            customerId,
            barberId,
            startTime,
            endTime,
            totalPrice: new Decimal(totalPrice),
            status: "BOOKED",
            appointmentServices: {
              create: services.map((service, index) => ({
                serviceId: service.id,
                priceOverride: null,
                order: index,
              })),
            },
          },
          include: {
            customer: true,
            barber: {
              include: {
                user: true,
              },
            },
            appointmentServices: {
              include: {
                service: true,
              },
            },
          },
        });

        return appointment;
      });
    },
    null
  );
}

/**
 * Update appointment status
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: "BOOKED" | "ARRIVED" | "MISSED" | "CANCELED" | "COMPLETED"
) {
  return await safePrismaQuery(
    async () => {
      if (!prisma) throw new Error("Database not available");
      return await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status },
      });
    },
    null
  );
}

/**
 * Cancel appointments for a barber within a date range
 */
export async function cancelAppointmentsByBarberAndDateRange(
  barberId: string,
  startDate: Date,
  endDate: Date
) {
  if (endDate <= startDate) {
    throw new Error("End date must be after start date");
  }

  return await safePrismaQuery(
    async () => {
      if (!prisma) throw new Error("Database not available");

      // Get appointments that will be canceled (for return value)
      const appointments = await prisma.appointment.findMany({
        where: {
          barberId,
          startTime: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            not: "CANCELED",
          },
        },
      });

      // Update all appointments to CANCELED status
      const result = await prisma.appointment.updateMany({
        where: {
          barberId,
          startTime: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            not: "CANCELED",
          },
        },
        data: {
          status: "CANCELED",
        },
      });

      return {
        canceledCount: result.count,
        appointments,
      };
    },
    { canceledCount: 0, appointments: [] }
  );
}
