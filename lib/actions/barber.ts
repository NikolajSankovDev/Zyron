"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentPrismaUser } from "@/lib/clerk-user-sync";
import { locales } from "@/lib/i18n/config-constants";
import {
  createBarberInClerk,
  createBarberInDatabase,
  updateBarberInDatabase,
  toggleBarberActive,
  createBarberTimeOff,
  cancelBarberAppointments,
} from "@/lib/services/barber";
import { cancelAppointmentsByBarberAndDateRange } from "@/lib/services/appointment";
import { prisma, safePrismaQuery } from "@/lib/prisma";

const createBarberSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  displayName: z.string().min(1, "Display name is required"),
  languages: z.array(z.string()).min(1, "At least one language is required"),
  bio: z.string().optional(),
});

const updateBarberSchema = z.object({
  displayName: z.string().min(1, "Display name is required").optional(),
  languages: z.array(z.string()).min(1, "At least one language is required").optional(),
  bio: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

const createTimeOffSchema = z.object({
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  reason: z.string().optional(),
});

const cancelAppointmentsSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().optional(),
});

export async function createBarberAction(formData: FormData) {
  const user = await getCurrentPrismaUser();

  if (!user) {
    return {
      error: "You must be logged in to create barbers",
    };
  }

  if (user.role !== "ADMIN") {
    return {
      error: "You must be an admin to create barbers",
    };
  }

  const rawData = {
    email: formData.get("email") as string,
    name: formData.get("name") as string,
    phone: formData.get("phone") as string,
    displayName: formData.get("displayName") as string,
    languages: JSON.parse(formData.get("languages") as string) as string[],
    bio: formData.get("bio") as string | null,
  };

  const validated = createBarberSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      error: validated.error.errors[0]?.message || "Invalid barber data",
    };
  }

  const { email, name, phone, displayName, languages, bio } = validated.data;

  try {
    // Check if user already exists
    const existingUser = await safePrismaQuery(
      async () => {
        if (!prisma) throw new Error("Database not available");
        return await prisma.user.findUnique({
          where: { email },
        });
      },
      null
    );

    if (existingUser) {
      return {
        error: "A user with this email already exists",
      };
    }

    // Create Clerk user
    const clerkUserId = await createBarberInClerk(email, name, phone);

    // Create Prisma records
    const barber = await createBarberInDatabase(
      clerkUserId,
      email,
      name,
      phone,
      displayName,
      languages,
      bio
    );

    if (!barber) {
      return {
        error: "Failed to create barber. Database may not be available.",
      };
    }

    // Revalidate barbers page
    locales.forEach((locale) => {
      revalidatePath(`/${locale}/admin/barbers`);
      revalidatePath(`/admin/barbers`);
    });

    return {
      success: true,
      barberId: barber.id,
    };
  } catch (error: any) {
    console.error("Barber creation error:", error);
    return {
      error: error.message || "Failed to create barber",
    };
  }
}

export async function updateBarberAction(barberId: string, formData: FormData) {
  const user = await getCurrentPrismaUser();

  if (!user) {
    return {
      error: "You must be logged in to update barbers",
    };
  }

  if (user.role !== "ADMIN") {
    return {
      error: "You must be an admin to update barbers",
    };
  }

  const rawData: any = {};
  const displayName = formData.get("displayName") as string | null;
  const languages = formData.get("languages") as string | null;
  const bio = formData.get("bio") as string | null;
  const active = formData.get("active") as string | null;

  if (displayName !== null) rawData.displayName = displayName;
  if (languages !== null) rawData.languages = JSON.parse(languages);
  if (bio !== null) rawData.bio = bio === "" ? null : bio;
  if (active !== null) rawData.active = active === "true";

  const validated = updateBarberSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      error: validated.error.errors[0]?.message || "Invalid barber data",
    };
  }

  try {
    const barber = await updateBarberInDatabase(barberId, validated.data);

    if (!barber) {
      return {
        error: "Failed to update barber. Barber may not exist.",
      };
    }

    // Revalidate barbers page
    locales.forEach((locale) => {
      revalidatePath(`/${locale}/admin/barbers`);
      revalidatePath(`/admin/barbers`);
    });

    return {
      success: true,
      barber,
    };
  } catch (error: any) {
    console.error("Barber update error:", error);
    return {
      error: error.message || "Failed to update barber",
    };
  }
}

export async function toggleBarberActiveAction(barberId: string) {
  const user = await getCurrentPrismaUser();

  if (!user) {
    return {
      error: "You must be logged in to toggle barber status",
    };
  }

  if (user.role !== "ADMIN") {
    return {
      error: "You must be an admin to toggle barber status",
    };
  }

  try {
    const barber = await toggleBarberActive(barberId);

    if (!barber) {
      return {
        error: "Failed to toggle barber status. Barber may not exist.",
      };
    }

    // Revalidate barbers page and booking pages
    locales.forEach((locale) => {
      revalidatePath(`/${locale}/admin/barbers`);
      revalidatePath(`/admin/barbers`);
      revalidatePath(`/${locale}`);
      revalidatePath(`/`);
    });

    return {
      success: true,
      barber,
    };
  } catch (error: any) {
    console.error("Toggle barber active error:", error);
    return {
      error: error.message || "Failed to toggle barber status",
    };
  }
}

export async function createBarberTimeOffAction(barberId: string, formData: FormData) {
  const user = await getCurrentPrismaUser();

  if (!user) {
    return {
      error: "You must be logged in to create time off",
    };
  }

  if (user.role !== "ADMIN") {
    return {
      error: "You must be an admin to create time off",
    };
  }

  const rawData = {
    startDateTime: formData.get("startDateTime") as string,
    endDateTime: formData.get("endDateTime") as string,
    reason: formData.get("reason") as string | null,
    cancelAppointments: formData.get("cancelAppointments") === "true",
  };

  const validated = createTimeOffSchema.safeParse({
    startDateTime: rawData.startDateTime,
    endDateTime: rawData.endDateTime,
    reason: rawData.reason || undefined,
  });

  if (!validated.success) {
    return {
      error: validated.error.errors[0]?.message || "Invalid time off data",
    };
  }

  try {
    const startDateTime = new Date(validated.data.startDateTime);
    const endDateTime = new Date(validated.data.endDateTime);

    // Create time off entry
    const timeOff = await createBarberTimeOff(
      barberId,
      startDateTime,
      endDateTime,
      validated.data.reason
    );

    if (!timeOff) {
      return {
        error: "Failed to create time off entry.",
      };
    }

    // Optionally cancel appointments
    if (rawData.cancelAppointments) {
      await cancelAppointmentsByBarberAndDateRange(barberId, startDateTime, endDateTime);
    }

    // Revalidate pages
    locales.forEach((locale) => {
      revalidatePath(`/${locale}/admin/barbers`);
      revalidatePath(`/admin/barbers`);
      revalidatePath(`/${locale}/admin/calendar`);
      revalidatePath(`/admin/calendar`);
    });

    return {
      success: true,
      timeOff,
    };
  } catch (error: any) {
    console.error("Create time off error:", error);
    return {
      error: error.message || "Failed to create time off",
    };
  }
}

export async function cancelBarberAppointmentsAction(barberId: string, formData: FormData) {
  const user = await getCurrentPrismaUser();

  if (!user) {
    return {
      error: "You must be logged in to cancel appointments",
    };
  }

  if (user.role !== "ADMIN") {
    return {
      error: "You must be an admin to cancel appointments",
    };
  }

  const rawData = {
    startDate: formData.get("startDate") as string,
    endDate: formData.get("endDate") as string,
    reason: formData.get("reason") as string | null,
  };

  const validated = cancelAppointmentsSchema.safeParse({
    startDate: rawData.startDate,
    endDate: rawData.endDate,
    reason: rawData.reason || undefined,
  });

  if (!validated.success) {
    return {
      error: validated.error.errors[0]?.message || "Invalid date range",
    };
  }

  try {
    const startDate = new Date(validated.data.startDate);
    const endDate = new Date(validated.data.endDate);

    const result = await cancelAppointmentsByBarberAndDateRange(barberId, startDate, endDate);

    // Revalidate pages
    locales.forEach((locale) => {
      revalidatePath(`/${locale}/admin/barbers`);
      revalidatePath(`/admin/barbers`);
      revalidatePath(`/${locale}/admin/calendar`);
      revalidatePath(`/admin/calendar`);
    });

    return {
      success: true,
      canceledCount: result.canceledCount,
    };
  } catch (error: any) {
    console.error("Cancel appointments error:", error);
    return {
      error: error.message || "Failed to cancel appointments",
    };
  }
}

