import { prisma, safePrismaQuery } from "@/lib/prisma";

export interface ServiceTranslationInput {
  locale: string;
  name: string;
  description?: string | null;
}

/**
 * Create service records in Prisma database
 */
export async function createServiceInDatabase(
  slug: string,
  durationMinutes: number,
  basePrice: number,
  translations: ServiceTranslationInput[],
  active: boolean = true,
  order: number = 0
) {
  return await safePrismaQuery(
    async () => {
      if (!prisma) throw new Error("Database not available");

      return await prisma.$transaction(async (tx) => {
        // Check if slug already exists
        const existingService = await tx.service.findUnique({
          where: { slug },
        });

        if (existingService) {
          throw new Error("Service with this slug already exists");
        }

        // Create service with translations
        const service = await tx.service.create({
          data: {
            slug,
            durationMinutes,
            basePrice,
            active,
            order,
            translations: {
              create: translations.map((translation) => ({
                locale: translation.locale,
                name: translation.name,
                description: translation.description || null,
              })),
            },
          },
          include: {
            translations: true,
          },
        });

        return service;
      });
    },
    null
  );
}

/**
 * Update service details in database
 */
export async function updateServiceInDatabase(
  serviceId: number,
  data: {
    slug?: string;
    durationMinutes?: number;
    basePrice?: number;
    active?: boolean;
    order?: number;
    translations?: ServiceTranslationInput[];
  }
) {
  return await safePrismaQuery(
    async () => {
      if (!prisma) throw new Error("Database not available");

      return await prisma.$transaction(async (tx) => {
        // Check if service exists
        const existingService = await tx.service.findUnique({
          where: { id: serviceId },
        });

        if (!existingService) {
          throw new Error("Service not found");
        }

        // If slug is being updated, check for uniqueness
        if (data.slug && data.slug !== existingService.slug) {
          const slugExists = await tx.service.findUnique({
            where: { slug: data.slug },
          });

          if (slugExists) {
            throw new Error("Service with this slug already exists");
          }
        }

        // Prepare update data
        const updateData: any = {};
        if (data.slug !== undefined) updateData.slug = data.slug;
        if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes;
        if (data.basePrice !== undefined) updateData.basePrice = data.basePrice;
        if (data.active !== undefined) updateData.active = data.active;
        if (data.order !== undefined) updateData.order = data.order;

        // Update service
        const service = await tx.service.update({
          where: { id: serviceId },
          data: updateData,
        });

        // Update translations if provided
        if (data.translations) {
          // Delete existing translations
          await tx.serviceTranslation.deleteMany({
            where: { serviceId },
          });

          // Create new translations
          if (data.translations.length > 0) {
            await tx.serviceTranslation.createMany({
              data: data.translations.map((translation) => ({
                serviceId,
                locale: translation.locale,
                name: translation.name,
                description: translation.description || null,
              })),
            });
          }
        }

        // Return updated service with translations
        return await tx.service.findUnique({
          where: { id: serviceId },
          include: {
            translations: true,
          },
        });
      });
    },
    null
  );
}

/**
 * Toggle service active status
 */
export async function toggleServiceActive(serviceId: number) {
  return await safePrismaQuery(
    async () => {
      if (!prisma) throw new Error("Database not available");

      // Get current active status
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: { active: true },
      });

      if (!service) {
        throw new Error("Service not found");
      }

      // Toggle active status
      return await prisma.service.update({
        where: { id: serviceId },
        data: { active: !service.active },
        include: {
          translations: true,
        },
      });
    },
    null
  );
}

