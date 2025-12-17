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
        const conflictingAppointment = await tx.appointment.findFirst({
          where: {
            barberId,
            startTime: {
              lte: endTime,
            },
            endTime: {
              gte: startTime,
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
