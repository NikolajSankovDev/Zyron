"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentPrismaUser } from "@/lib/clerk-user-sync";
import { locales } from "@/lib/i18n/config-constants";
import {
  createServiceInDatabase,
  updateServiceInDatabase,
  toggleServiceActive,
} from "@/lib/services/service";

const serviceTranslationSchema = z.object({
  locale: z.string().min(1, "Locale is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
});

const createServiceSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9_-]+$/, "Slug must contain only lowercase letters, numbers, hyphens, and underscores"),
  durationMinutes: z.number().int().min(1, "Duration must be at least 1 minute"),
  basePrice: z.number().min(0, "Price must be non-negative"),
  active: z.boolean().default(true),
  order: z.number().int().default(0),
  translations: z.array(serviceTranslationSchema).min(1, "At least one translation is required"),
});

const updateServiceSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9_-]+$/, "Slug must contain only lowercase letters, numbers, hyphens, and underscores")
    .optional(),
  durationMinutes: z.number().int().min(1, "Duration must be at least 1 minute").optional(),
  basePrice: z.number().min(0, "Price must be non-negative").optional(),
  active: z.boolean().optional(),
  order: z.number().int().optional(),
  translations: z.array(serviceTranslationSchema).optional(),
});

export async function createServiceAction(formData: FormData) {
  const user = await getCurrentPrismaUser();

  if (!user) {
    return {
      error: "You must be logged in to create services",
    };
  }

  if (user.role !== "ADMIN") {
    return {
      error: "You must be an admin to create services",
    };
  }

  const rawData = {
    slug: formData.get("slug") as string,
    durationMinutes: parseInt(formData.get("durationMinutes") as string, 10),
    basePrice: parseFloat(formData.get("basePrice") as string),
    active: formData.get("active") === "true",
    order: formData.get("order") ? parseInt(formData.get("order") as string, 10) : 0,
    translations: JSON.parse(formData.get("translations") as string) as Array<{
      locale: string;
      name: string;
      description?: string | null;
    }>,
  };

  const validated = createServiceSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      error: validated.error.errors[0]?.message || "Invalid service data",
    };
  }

  const { slug, durationMinutes, basePrice, active, order, translations } = validated.data;

  try {
    const service = await createServiceInDatabase(
      slug,
      durationMinutes,
      basePrice,
      translations,
      active,
      order
    );

    if (!service) {
      return {
        error: "Failed to create service. Database may not be available.",
      };
    }

    // Revalidate services pages
    locales.forEach((locale) => {
      revalidatePath(`/${locale}/admin/services`);
      revalidatePath(`/admin/services`);
      revalidatePath(`/${locale}/(public)/services`);
    });

    return {
      success: true,
      service,
    };
  } catch (error: any) {
    console.error("Service creation error:", error);
    return {
      error: error.message || "Failed to create service",
    };
  }
}

export async function updateServiceAction(serviceId: number, formData: FormData) {
  const user = await getCurrentPrismaUser();

  if (!user) {
    return {
      error: "You must be logged in to update services",
    };
  }

  if (user.role !== "ADMIN") {
    return {
      error: "You must be an admin to update services",
    };
  }

  const rawData: any = {};
  const slug = formData.get("slug") as string | null;
  const durationMinutes = formData.get("durationMinutes") as string | null;
  const basePrice = formData.get("basePrice") as string | null;
  const active = formData.get("active") as string | null;
  const order = formData.get("order") as string | null;
  const translations = formData.get("translations") as string | null;

  if (slug !== null) rawData.slug = slug;
  if (durationMinutes !== null) rawData.durationMinutes = parseInt(durationMinutes, 10);
  if (basePrice !== null) rawData.basePrice = parseFloat(basePrice);
  if (active !== null) rawData.active = active === "true";
  if (order !== null) rawData.order = parseInt(order, 10);
  if (translations !== null) rawData.translations = JSON.parse(translations);

  const validated = updateServiceSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      error: validated.error.errors[0]?.message || "Invalid service data",
    };
  }

  try {
    const service = await updateServiceInDatabase(serviceId, validated.data);

    if (!service) {
      return {
        error: "Failed to update service. Service may not exist.",
      };
    }

    // Revalidate services pages
    locales.forEach((locale) => {
      revalidatePath(`/${locale}/admin/services`);
      revalidatePath(`/admin/services`);
      revalidatePath(`/${locale}/(public)/services`);
    });

    return {
      success: true,
      service,
    };
  } catch (error: any) {
    console.error("Service update error:", error);
    return {
      error: error.message || "Failed to update service",
    };
  }
}

export async function toggleServiceActiveAction(serviceId: number) {
  const user = await getCurrentPrismaUser();

  if (!user) {
    return {
      error: "You must be logged in to toggle service status",
    };
  }

  if (user.role !== "ADMIN") {
    return {
      error: "You must be an admin to toggle service status",
    };
  }

  try {
    const service = await toggleServiceActive(serviceId);

    if (!service) {
      return {
        error: "Failed to toggle service status. Service may not exist.",
      };
    }

    // Revalidate services pages
    locales.forEach((locale) => {
      revalidatePath(`/${locale}/admin/services`);
      revalidatePath(`/admin/services`);
      revalidatePath(`/${locale}/(public)/services`);
    });

    return {
      success: true,
      service,
    };
  } catch (error: any) {
    console.error("Toggle service active error:", error);
    return {
      error: error.message || "Failed to toggle service status",
    };
  }
}

