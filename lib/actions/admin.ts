"use server";

import { createAppointment } from "@/lib/services/appointment";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma, safePrismaQuery } from "@/lib/prisma";
import { locales } from "@/lib/i18n/config-constants";
import { getCurrentPrismaUser } from "@/lib/clerk-user-sync";
import { logger } from "@/lib/logger";
import { deleteClerkUser, revokeClerkUserSessions, getClerkUser } from "@/lib/clerk";
import { startOfDay } from "date-fns";

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

export async function deletePastAppointmentsAction() {
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
    // Calculate start of today (midnight) in local timezone
    const todayStart = startOfDay(new Date());

    // Delete all appointments before today using a transaction
    const result = await safePrismaQuery(
      async () => {
        if (!prisma) throw new Error("Database not available");
        
        return await prisma.$transaction(async (tx) => {
          // First, find all appointments before today
          const pastAppointments = await tx.appointment.findMany({
            where: {
              startTime: {
                lt: todayStart,
              },
            },
            select: {
              id: true,
            },
          });

          const appointmentIds = pastAppointments.map((apt) => apt.id);

          if (appointmentIds.length === 0) {
            return { deletedCount: 0 };
          }

          // Delete related appointment services first
          await tx.appointmentService.deleteMany({
            where: {
              appointmentId: {
                in: appointmentIds,
              },
            },
          });

          // Then delete the appointments
          const deleteResult = await tx.appointment.deleteMany({
            where: {
              id: {
                in: appointmentIds,
              },
            },
          });

          return { deletedCount: deleteResult.count };
        });
      },
      { deletedCount: 0 }
    );

    // Revalidate all locale variants of the admin calendar page
    locales.forEach((locale) => {
      revalidatePath(`/${locale}/admin/calendar`);
    });

    return { 
      success: true, 
      deletedCount: result.deletedCount 
    };
  } catch (error: any) {
    console.error("Past appointments deletion error:", error);
    return {
      error: error.message || "Failed to delete past appointments",
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

export async function deleteCustomerAction(customerId: string) {
  // Get current user from Prisma (synced from Clerk)
  const user = await getCurrentPrismaUser();

  if (!user) {
    return {
      error: "You must be logged in to delete customers",
    };
  }

  if (!["ADMIN", "BARBER"].includes(user.role)) {
    return {
      error: "You must be an admin or barber to delete customers",
    };
  }

  if (!prisma) {
    return {
      error: "Database not available",
    };
  }

  try {
    // Get the customer to find their Clerk user ID
    const customer = await safePrismaQuery(
      async () => {
        if (!prisma) throw new Error("Database not available");
        return await prisma.user.findUnique({
          where: { id: customerId },
          select: {
            id: true,
            email: true,
            clerkUserId: true,
            role: true,
          },
        });
      },
      null
    );

    if (!customer) {
      return {
        error: "Customer not found",
      };
    }

    // Ensure we're only deleting customers
    if (customer.role !== "CUSTOMER") {
      return {
        error: "Only customers can be deleted from this page",
      };
    }

    // Delete from Clerk first (if they have a Clerk account)
    // This MUST happen before Prisma deletion to ensure consistency
    let clerkDeletionSuccess = false;
    let clerkDeletionError: string | null = null;

    if (customer.clerkUserId) {
      // Check if Clerk secret key is configured
      if (!process.env.CLERK_SECRET_KEY) {
        logger.error(`[deleteCustomerAction] CLERK_SECRET_KEY is not configured! Cannot delete from Clerk.`);
        clerkDeletionError = 'Clerk secret key not configured';
      } else {
        logger.info(`[deleteCustomerAction] Attempting to delete Clerk user ${customer.clerkUserId} for customer ${customerId} (${customer.email})`);
        
        try {
          // Revoke sessions first (this is safe even if no sessions exist)
          try {
            await revokeClerkUserSessions(customer.clerkUserId);
            logger.info(`[deleteCustomerAction] Revoked sessions for Clerk user ${customer.clerkUserId}`);
          } catch (sessionError: any) {
            // Log but continue - session revocation failure shouldn't block deletion
            logger.warn(`[deleteCustomerAction] Failed to revoke sessions (continuing anyway): ${sessionError?.message || sessionError}`);
          }
          
          // Then delete the Clerk user
          try {
            await deleteClerkUser(customer.clerkUserId);
            logger.info(`[deleteCustomerAction] ✓ Successfully deleted Clerk user ${customer.clerkUserId}`);
            clerkDeletionSuccess = true;
          } catch (deleteError: any) {
            // If user was already deleted (404), that's fine - consider it success
            if (deleteError?.status === 404 || 
                deleteError?.statusCode === 404 || 
                deleteError?.errors?.[0]?.code === 'resource_not_found' ||
                deleteError?.code === 'resource_not_found') {
              logger.info(`[deleteCustomerAction] Clerk user ${customer.clerkUserId} was already deleted (404)`);
              clerkDeletionSuccess = true;
            } else {
              // For other errors, log the full error details
              const errorDetails = {
                message: deleteError?.message,
                status: deleteError?.status,
                statusCode: deleteError?.statusCode,
                code: deleteError?.code,
                errors: deleteError?.errors,
                name: deleteError?.name,
              };
              logger.error(`[deleteCustomerAction] ✗ Failed to delete Clerk user ${customer.clerkUserId}:`, deleteError);
              logger.error(`[deleteCustomerAction] Full error object:`, JSON.stringify(errorDetails, null, 2));
              clerkDeletionError = deleteError?.message || `Clerk API error: ${deleteError?.status || deleteError?.statusCode || 'Unknown'}`;
              // Don't throw - we'll still delete from Prisma but log the error clearly
            }
          }
        } catch (clerkError: any) {
          // Catch any unexpected errors
          logger.error(`[deleteCustomerAction] Unexpected error during Clerk deletion:`, clerkError);
          clerkDeletionError = clerkError?.message || 'Unexpected Clerk error';
        }
      }
    } else {
      logger.info(`[deleteCustomerAction] Customer ${customerId} (${customer.email}) has no Clerk user ID, skipping Clerk deletion`);
      clerkDeletionSuccess = true; // No Clerk user to delete, so consider it successful
    }

    // Delete from Prisma database (appointments will cascade delete automatically)
    const deleteResult = await safePrismaQuery(
      async () => {
        if (!prisma) throw new Error("Database not available");
        return await prisma.user.delete({
          where: { id: customerId },
        });
      },
      null
    );

    if (!deleteResult) {
      return {
        error: "Failed to delete customer from database",
      };
    }

    logger.info(`[deleteCustomerAction] Successfully deleted customer ${customerId} (${customer.email}) from Prisma`);

    // Revalidate the customers page
    locales.forEach((locale) => {
      revalidatePath(`/${locale}/admin/customers`);
    });

    // Return success, but include warning if Clerk deletion failed
    if (clerkDeletionError) {
      logger.warn(`[deleteCustomerAction] Customer deleted from Prisma but Clerk deletion failed: ${clerkDeletionError}`);
      return { 
        success: true, 
        warning: `Customer deleted from database, but failed to delete from Clerk: ${clerkDeletionError}. Please delete manually from Clerk dashboard.` 
      };
    }

    return { success: true };
  } catch (error: any) {
    logger.error("Failed to delete customer:", error);
    return {
      error: error.message || "Failed to delete customer",
    };
  }
}

