"use server";

import { createAppointment } from "@/lib/services/appointment";
import { sendBookingConfirmation } from "@/lib/services/email";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentPrismaUser } from "@/lib/clerk-user-sync";

const createAppointmentSchema = z.object({
  barberId: z.string(),
  startTime: z.string().datetime(),
  serviceIds: z.array(z.number()),
});

export async function createAppointmentAction(formData: FormData) {
  // Get current user from Prisma (synced from Clerk)
  const user = await getCurrentPrismaUser();

  if (!user) {
    return {
      error: "You must be logged in to book an appointment",
    };
  }

  const rawData = {
    barberId: formData.get("barberId") as string,
    startTime: formData.get("startTime") as string,
    serviceIds: JSON.parse(formData.get("serviceIds") as string) as number[],
  };

  const validated = createAppointmentSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      error: "Invalid appointment data",
    };
  }

  const { barberId, startTime, serviceIds } = validated.data;
  const customerId = user.id;

  try {
    const appointment = await createAppointment({
      customerId,
      barberId,
      startTime: new Date(startTime),
      serviceIds,
    });

    if (!appointment) {
      return {
        error: "Failed to create appointment. Database may not be available.",
      };
    }

    // Send confirmation email
    try {
      await sendBookingConfirmation(appointment.id);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't fail the booking if email fails
    }

    revalidatePath("/account");
    redirect("/account/appointments");
  } catch (error: any) {
    console.error("Appointment creation error:", error);
    return {
      error: error.message || "Failed to create appointment",
    };
  }
}
