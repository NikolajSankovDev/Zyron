"use server";

import { createAppointment } from "@/lib/services/appointment";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma, safePrismaQuery } from "@/lib/prisma";
import { locales } from "@/lib/i18n/config-constants";
import { getCurrentPrismaUser } from "@/lib/clerk-user-sync";

const createAdminAppointmentSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().optional(),
  barberId: z.string(),
  startTime: z.string().datetime(),
  serviceIds: z.array(z.number()),
  notes: z.string().optional(),
});

// Note: Sign out is now handled client-side using Clerk's useClerk hook
// This function is kept for backward compatibility but should be replaced
export async function signOutAction() {
  return { success: true };
}

export async function createAdminAppointmentAction(formData: FormData) {
  // Get current user from Prisma (synced from Clerk)
  const user = await getCurrentPrismaUser();

  if (!user) {
    return {
      error: "You must be logged in to create appointments",
    };
  }

  if (!["ADMIN", "BARBER"].includes(user.role)) {
    return {
      error: "You must be an admin or barber to create appointments",
    };
  }

  const rawData = {
    customerName: formData.get("customerName") as string,
    customerEmail: formData.get("customerEmail") as string,
    customerPhone: formData.get("customerPhone") as string | null,
    barberId: formData.get("barberId") as string,
    startTime: formData.get("startTime") as string,
    serviceIds: JSON.parse(formData.get("serviceIds") as string) as number[],
    notes: formData.get("notes") as string | null,
  };

  const validated = createAdminAppointmentSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      error: validated.error.errors[0]?.message || "Invalid appointment data",
    };
  }

  const { customerName, customerEmail, customerPhone, barberId, startTime, serviceIds, notes } = validated.data;

  try {
    // Find or create customer
    let customer = await safePrismaQuery(
      async () => {
        if (!prisma) throw new Error("Database not available");
        return await prisma.user.findUnique({
          where: { email: customerEmail },
        });
      },
      null
    );

    if (!customer) {
      // Create new customer user (without password - Clerk handles auth)
      // Note: Customer will need to sign up via Clerk to get full access
      // clerkUserId will be set when customer signs up via Clerk and webhook syncs
      customer = await safePrismaQuery(
        async () => {
          if (!prisma) throw new Error("Database not available");
          return await prisma.user.create({
            data: {
              name: customerName,
              email: customerEmail,
              phone: customerPhone || "", // Phone is required
              role: "CUSTOMER",
              clerkUserId: null, // Will be set when customer signs up via Clerk
            },
          });
        },
        null
      );

      if (!customer) {
        return {
          error: "Failed to create customer. Database may not be available.",
        };
      }
    }

    // Validate appointment time against barber's working hours
    const appointmentDate = new Date(startTime);
    const weekday = appointmentDate.getDay();
    
    const workingHours = await safePrismaQuery(
      async () => {
        if (!prisma) throw new Error("Database not available");
        return await prisma.barberWorkingHours.findUnique({
          where: {
            barberId_weekday: {
              barberId,
              weekday,
            },
          },
        });
      },
      null
    );

    if (!workingHours) {
      return {
        error: `Barber is not available on ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][weekday]}`,
      };
    }

    // Check if appointment time is within working hours
    const [startHour, startMinute] = workingHours.startTime.split(":").map(Number);
    const [endHour, endMinute] = workingHours.endTime.split(":").map(Number);
    const appointmentHour = appointmentDate.getHours();
    const appointmentMinute = appointmentDate.getMinutes();
    
    const appointmentTimeMinutes = appointmentHour * 60 + appointmentMinute;
    const workingStartMinutes = startHour * 60 + startMinute;
    const workingEndMinutes = endHour * 60 + endMinute;
    
    // Get total duration of services
    const services = await safePrismaQuery(
      async () => {
        if (!prisma) throw new Error("Database not available");
        return await prisma.service.findMany({
          where: { id: { in: serviceIds } },
        });
      },
      []
    );
    
    const totalDuration = services.reduce((sum, s) => sum + s.durationMinutes, 0);
    const appointmentEndTimeMinutes = appointmentTimeMinutes + totalDuration;
    
    if (appointmentTimeMinutes < workingStartMinutes || appointmentEndTimeMinutes > workingEndMinutes) {
      return {
        error: `Appointment time must be within barber's working hours (${workingHours.startTime} - ${workingHours.endTime})`,
      };
    }

    // Create appointment
    const appointment = await createAppointment({
      customerId: customer.id,
      barberId,
      startTime: appointmentDate,
      serviceIds,
    });

    if (!appointment) {
      return {
        error: "Failed to create appointment. Database may not be available.",
      };
    }

    // Add notes if provided
    if (notes) {
      await safePrismaQuery(
        async () => {
          if (!prisma) throw new Error("Database not available");
          return await prisma.appointment.update({
            where: { id: appointment.id },
            data: { notes },
          });
        },
        null
      );
    }

    // Revalidate all locale variants of the admin calendar page
    locales.forEach((locale) => {
      revalidatePath(`/${locale}/admin/calendar`);
    });
    return { success: true, appointmentId: appointment.id };
  } catch (error: any) {
    console.error("Admin appointment creation error:", error);
    return {
      error: error.message || "Failed to create appointment",
    };
  }
}

export async function deleteAppointmentAction(appointmentId: string) {
  // Get current user from Prisma (synced from Clerk)
  const user = await getCurrentPrismaUser();

  if (!user) {
    return {
      error: "You must be logged in to delete appointments",
    };
  }

  if (!["ADMIN", "BARBER"].includes(user.role)) {
    return {
      error: "You must be an admin or barber to delete appointments",
    };
  }

  try {
    // First delete related appointment services
    await safePrismaQuery(
      async () => {
        if (!prisma) throw new Error("Database not available");
        return await prisma.appointmentService.deleteMany({
          where: { appointmentId },
        });
      },
      null
    );

    // Then delete the appointment
    const deleted = await safePrismaQuery(
      async () => {
        if (!prisma) throw new Error("Database not available");
        return await prisma.appointment.delete({
          where: { id: appointmentId },
        });
      },
      null
    );

    if (!deleted) {
      return {
        error: "Failed to delete appointment. It may have already been deleted.",
      };
    }

    // Revalidate all locale variants of the admin calendar page
    locales.forEach((locale) => {
      revalidatePath(`/${locale}/admin/calendar`);
    });
    return { success: true };
  } catch (error: any) {
    console.error("Appointment deletion error:", error);
    return {
      error: error.message || "Failed to delete appointment",
    };
  }
}

export async function updateAppointmentStatusAction(
  appointmentId: string,
  status: "BOOKED" | "ARRIVED" | "MISSED" | "CANCELED" | "COMPLETED"
) {
  // Get current user from Prisma (synced from Clerk)
  const user = await getCurrentPrismaUser();

  if (!user) {
    return {
      error: "You must be logged in to update appointments",
    };
  }

  if (!["ADMIN", "BARBER"].includes(user.role)) {
    return {
      error: "You must be an admin or barber to update appointments",
    };
  }

  try {
    const updated = await safePrismaQuery(
      async () => {
        if (!prisma) throw new Error("Database not available");
        return await prisma.appointment.update({
          where: { id: appointmentId },
          data: { status },
        });
      },
      null
    );

    if (!updated) {
      return {
        error: "Failed to update appointment status.",
      };
    }

    // Revalidate all locale variants of the admin calendar page
    locales.forEach((locale) => {
      revalidatePath(`/${locale}/admin/calendar`);
    });
    return { success: true };
  } catch (error: any) {
    console.error("Appointment status update error:", error);
    return {
      error: error.message || "Failed to update appointment status",
    };
  }
}

export async function rescheduleAppointmentAction(
  appointmentId: string,
  newStartTime: string,
  newEndTime: string,
  newBarberId?: string
) {
  // Get current user from Prisma (synced from Clerk)
  const user = await getCurrentPrismaUser();

  if (!user) {
    return {
      error: "You must be logged in to reschedule appointments",
    };
  }

  if (!["ADMIN", "BARBER"].includes(user.role)) {
    return {
      error: "You must be an admin or barber to reschedule appointments",
    };
  }

  try {
    const newStart = new Date(newStartTime);
    const newEnd = new Date(newEndTime);

    // Get the appointment to check current barber
    const currentAppointment = await safePrismaQuery(
      async () => {
        if (!prisma) throw new Error("Database not available");
        return await prisma.appointment.findUnique({
          where: { id: appointmentId },
        });
      },
      null
    );

    if (!currentAppointment) {
      return { error: "Appointment not found" };
    }

    const targetBarberId = newBarberId || currentAppointment.barberId;
    const weekday = newStart.getDay();

    // Validate against barber's working hours
    const workingHours = await safePrismaQuery(
      async () => {
        if (!prisma) throw new Error("Database not available");
        return await prisma.barberWorkingHours.findUnique({
          where: {
            barberId_weekday: {
              barberId: targetBarberId,
              weekday,
            },
          },
        });
      },
      null
    );

    if (!workingHours) {
      return {
        error: `Barber is not available on ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][weekday]}`,
      };
    }

    // Check if new time is within working hours
    const [startHour, startMinute] = workingHours.startTime.split(":").map(Number);
    const [endHour, endMinute] = workingHours.endTime.split(":").map(Number);
    const appointmentStartMinutes = newStart.getHours() * 60 + newStart.getMinutes();
    const appointmentEndMinutes = newEnd.getHours() * 60 + newEnd.getMinutes();
    const workingStartMinutes = startHour * 60 + startMinute;
    const workingEndMinutes = endHour * 60 + endMinute;

    if (appointmentStartMinutes < workingStartMinutes || appointmentEndMinutes > workingEndMinutes) {
      return {
        error: `Appointment time must be within barber's working hours (${workingHours.startTime} - ${workingHours.endTime})`,
      };
    }

    // Check for conflicts with other appointments (excluding current one)
    const conflictingAppointment = await safePrismaQuery(
      async () => {
        if (!prisma) throw new Error("Database not available");
        return await prisma.appointment.findFirst({
          where: {
            barberId: targetBarberId,
            id: { not: appointmentId },
            status: { not: "CANCELED" },
            AND: [
              { startTime: { lt: newEnd } },
              { endTime: { gt: newStart } },
            ],
          },
        });
      },
      null
    );

    if (conflictingAppointment) {
      return {
        error: "This time slot conflicts with another appointment",
      };
    }

    // Update the appointment
    const updateData: any = {
      startTime: newStart,
      endTime: newEnd,
    };

    if (newBarberId) {
      updateData.barberId = newBarberId;
    }

    const updated = await safePrismaQuery(
      async () => {
        if (!prisma) throw new Error("Database not available");
        return await prisma.appointment.update({
          where: { id: appointmentId },
          data: updateData,
        });
      },
      null
    );

    if (!updated) {
      return {
        error: "Failed to reschedule appointment",
      };
    }

    // Revalidate all locale variants of the admin calendar page
    locales.forEach((locale) => {
      revalidatePath(`/${locale}/admin/calendar`);
    });

    return { success: true };
  } catch (error: any) {
    console.error("Reschedule appointment error:", error);
    return {
      error: error.message || "Failed to reschedule appointment",
    };
  }
}

export async function updateAppointmentNoteAction(
  appointmentId: string,
  notes: string
) {
  // Get current user from Prisma (synced from Clerk)
  const user = await getCurrentPrismaUser();

  if (!user) {
    return {
      error: "You must be logged in to update appointment notes",
    };
  }

  if (!["ADMIN", "BARBER"].includes(user.role)) {
    return {
      error: "You must be an admin or barber to update appointment notes",
    };
  }

  try {
    const updated = await safePrismaQuery(
      async () => {
        if (!prisma) throw new Error("Database not available");
        return await prisma.appointment.update({
          where: { id: appointmentId },
          data: { notes: notes || null },
        });
      },
      null
    );

    if (!updated) {
      return {
        error: "Failed to update appointment notes.",
      };
    }

    // Revalidate all locale variants of the admin calendar page
    locales.forEach((locale) => {
      revalidatePath(`/${locale}/admin/calendar`);
    });
    return { success: true };
  } catch (error: any) {
    console.error("Update appointment note error:", error);
    return {
      error: error.message || "Failed to update appointment notes",
    };
  }
}

export async function updateAppointmentDurationAction(
  appointmentId: string,
  newDurationMinutes: number
) {
  // Get current user from Prisma (synced from Clerk)
  const user = await getCurrentPrismaUser();

  if (!user) {
    return {
      error: "You must be logged in to update appointment duration",
    };
  }

  if (!["ADMIN", "BARBER"].includes(user.role)) {
    return {
      error: "You must be an admin or barber to update appointment duration",
    };
  }

  if (newDurationMinutes <= 0) {
    return {
      error: "Duration must be greater than 0",
    };
  }

  try {
    // Get the current appointment
    const currentAppointment = await safePrismaQuery(
      async () => {
        if (!prisma) throw new Error("Database not available");
        return await prisma.appointment.findUnique({
          where: { id: appointmentId },
        });
      },
      null
    );

    if (!currentAppointment) {
      return { error: "Appointment not found" };
    }

    // Calculate new end time
    const newStartTime = new Date(currentAppointment.startTime);
    const newEndTime = new Date(newStartTime);
    newEndTime.setMinutes(newEndTime.getMinutes() + newDurationMinutes);

    // Validate against barber's working hours
    const weekday = newStartTime.getDay();
    const workingHours = await safePrismaQuery(
      async () => {
        if (!prisma) throw new Error("Database not available");
        return await prisma.barberWorkingHours.findUnique({
          where: {
            barberId_weekday: {
              barberId: currentAppointment.barberId,
              weekday,
            },
          },
        });
      },
      null
    );

    if (!workingHours) {
      return {
        error: `Barber is not available on ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][weekday]}`,
      };
    }

    // Check if new time is within working hours
    const [startHour, startMinute] = workingHours.startTime.split(":").map(Number);
    const [endHour, endMinute] = workingHours.endTime.split(":").map(Number);
    const appointmentStartMinutes = newStartTime.getHours() * 60 + newStartTime.getMinutes();
    const appointmentEndMinutes = newEndTime.getHours() * 60 + newEndTime.getMinutes();
    const workingStartMinutes = startHour * 60 + startMinute;
    const workingEndMinutes = endHour * 60 + endMinute;

    if (appointmentStartMinutes < workingStartMinutes || appointmentEndMinutes > workingEndMinutes) {
      return {
        error: `Appointment time must be within barber's working hours (${workingHours.startTime} - ${workingHours.endTime})`,
      };
    }

    // Check for conflicts with other appointments (excluding current one)
    const conflictingAppointment = await safePrismaQuery(
      async () => {
        if (!prisma) throw new Error("Database not available");
        return await prisma.appointment.findFirst({
          where: {
            barberId: currentAppointment.barberId,
            id: { not: appointmentId },
            status: { not: "CANCELED" },
            AND: [
              { startTime: { lt: newEndTime } },
              { endTime: { gt: newStartTime } },
            ],
          },
        });
      },
      null
    );

    if (conflictingAppointment) {
      return {
        error: "This duration change conflicts with another appointment",
      };
    }

    // Update the appointment
    const updated = await safePrismaQuery(
      async () => {
        if (!prisma) throw new Error("Database not available");
        return await prisma.appointment.update({
          where: { id: appointmentId },
          data: {
            endTime: newEndTime,
          },
        });
      },
      null
    );

    if (!updated) {
      return {
        error: "Failed to update appointment duration",
      };
    }

    // Revalidate all locale variants of the admin calendar page
    locales.forEach((locale) => {
      revalidatePath(`/${locale}/admin/calendar`);
    });

    return { success: true };
  } catch (error: any) {
    console.error("Update appointment duration error:", error);
    return {
      error: error.message || "Failed to update appointment duration",
    };
  }
}

