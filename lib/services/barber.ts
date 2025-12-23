import { prisma, safePrismaQuery } from "@/lib/prisma";
import { createClerkUserWithInvitation } from "@/lib/clerk";
import { logger } from "@/lib/logger";

/**
 * Create a Clerk user with invitation and return the Clerk user ID
 */
export async function createBarberInClerk(
  email: string,
  name: string,
  phone: string
): Promise<string> {
  // Split name into first and last name
  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  try {
    const clerkUser = await createClerkUserWithInvitation(
      email,
      firstName,
      lastName,
      phone,
      "BARBER"
    );

    return clerkUser.id;
  } catch (error: any) {
    logger.error(`Failed to create Clerk user for barber ${email}:`, error as Error);
    throw new Error(`Failed to create Clerk user: ${error.message || "Unknown error"}`);
  }
}

/**
 * Create barber records in Prisma database
 * Must be called after creating Clerk user
 */
export async function createBarberInDatabase(
  clerkUserId: string,
  email: string,
  name: string,
  phone: string,
  displayName: string,
  languages: string[],
  bio?: string
) {
  return await safePrismaQuery(
    async () => {
      if (!prisma) throw new Error("Database not available");

      return await prisma.$transaction(async (tx) => {
        // First, check if user already exists (might be created by webhook)
        let user = await tx.user.findUnique({
          where: { clerkUserId },
        });

        if (!user) {
          // Create user record
          user = await tx.user.create({
            data: {
              clerkUserId,
              email,
              name,
              phone,
              role: "BARBER",
            },
          });
        } else {
          // Update existing user if needed
          user = await tx.user.update({
            where: { id: user.id },
            data: {
              email,
              name,
              phone,
              role: "BARBER",
            },
          });
        }

        // Create barber record
        const barber = await tx.barber.create({
          data: {
            userId: user.id,
            displayName,
            languages,
            bio: bio || null,
            active: true,
          },
          include: {
            user: true,
          },
        });

        return barber;
      });
    },
    null
  );
}

/**
 * Update barber details in database
 */
export async function updateBarberInDatabase(
  barberId: string,
  data: {
    displayName?: string;
    languages?: string[];
    bio?: string | null;
    active?: boolean;
  }
) {
  return await safePrismaQuery(
    async () => {
      if (!prisma) throw new Error("Database not available");

      const updateData: any = {};
      if (data.displayName !== undefined) updateData.displayName = data.displayName;
      if (data.languages !== undefined) updateData.languages = data.languages;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.active !== undefined) updateData.active = data.active;

      return await prisma.barber.update({
        where: { id: barberId },
        data: updateData,
        include: {
          user: true,
        },
      });
    },
    null
  );
}

/**
 * Toggle barber active status
 */
export async function toggleBarberActive(barberId: string) {
  return await safePrismaQuery(
    async () => {
      if (!prisma) throw new Error("Database not available");

      // Get current active status
      const barber = await prisma.barber.findUnique({
        where: { id: barberId },
        select: { active: true },
      });

      if (!barber) {
        throw new Error("Barber not found");
      }

      // Toggle active status
      return await prisma.barber.update({
        where: { id: barberId },
        data: { active: !barber.active },
        include: {
          user: true,
        },
      });
    },
    null
  );
}

/**
 * Create a time off entry for a barber
 */
export async function createBarberTimeOff(
  barberId: string,
  startDateTime: Date,
  endDateTime: Date,
  reason?: string
) {
  if (endDateTime <= startDateTime) {
    throw new Error("End date must be after start date");
  }

  return await safePrismaQuery(
    async () => {
      if (!prisma) throw new Error("Database not available");

      return await prisma.barberTimeOff.create({
        data: {
          barberId,
          startDateTime,
          endDateTime,
          reason: reason || null,
        },
      });
    },
    null
  );
}

/**
 * Cancel all appointments for a barber within a date range
 */
export async function cancelBarberAppointments(
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

      // Find all appointments in the date range that are not already canceled
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

