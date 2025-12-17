import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserFromClerk } from "@/lib/clerk-user-sync";
import { getClerkUser, formatClerkUser } from "@/lib/clerk";
import { logger } from "@/lib/logger";

/**
 * Sync phone number from Clerk to Prisma
 * This endpoint can be called anytime to ensure phone is synced
 * Aggressively retries until phone is saved
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  logger.info(`[sync-phone API] Starting phone sync request`);

  try {
    const { userId } = await auth();

    if (!userId) {
      logger.error(`[sync-phone API] No userId from auth()`);
      return NextResponse.json(
        { error: "You must be logged in to sync phone number" },
        { status: 401 }
      );
    }

    logger.info(`[sync-phone API] Syncing phone for userId: ${userId}`);

    if (!prisma) {
      logger.error(`[sync-phone API] Prisma client not available`);
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    // Step 1: Get phone from Clerk (metadata + phoneNumbers)
    let phoneFromClerk: string | null = null;
    try {
      const clerkUser = await getClerkUser(userId);
      const formattedUser = formatClerkUser(clerkUser);
      phoneFromClerk = formattedUser.phone;
      logger.info(`[sync-phone API] Got phone from Clerk: ${phoneFromClerk || 'none'}`);
    } catch (error: any) {
      logger.error(`[sync-phone API] Failed to get phone from Clerk:`, error);
      return NextResponse.json(
        { error: "Failed to fetch phone from Clerk" },
        { status: 500 }
      );
    }

    if (!phoneFromClerk || phoneFromClerk.trim().length === 0) {
      logger.warn(`[sync-phone API] No phone found in Clerk for userId: ${userId}`);
      return NextResponse.json(
        { error: "No phone number found in Clerk account" },
        { status: 404 }
      );
    }

    const phoneTrimmed = phoneFromClerk.trim();

    // Step 2: Update Prisma with aggressive retries
    let prismaUser = null;
    const maxRetries = 15;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Use getOrCreateUserFromClerk which handles user creation if needed
        prismaUser = await getOrCreateUserFromClerk(userId);
        
        if (prismaUser) {
          // Check if phone needs updating
          if (prismaUser.phone !== phoneTrimmed) {
            await prisma.user.update({
              where: { id: prismaUser.id },
              data: { phone: phoneTrimmed },
            });
            const elapsed = Date.now() - startTime;
            logger.info(`[sync-phone API] ✓✓✓ SUCCESS: Updated Prisma user ${prismaUser.id} with phone: ${phoneTrimmed} (attempt ${i + 1}, ${elapsed}ms)`);
            return NextResponse.json({ 
              success: true, 
              phone: phoneTrimmed,
              message: `Phone synced successfully after ${i + 1} attempts`
            });
          } else {
            // Phone already matches
            const elapsed = Date.now() - startTime;
            logger.info(`[sync-phone API] Phone already synced: ${phoneTrimmed} (${elapsed}ms)`);
            return NextResponse.json({ 
              success: true, 
              phone: phoneTrimmed,
              message: "Phone already synced"
            });
          }
        }

        // If user doesn't exist yet, wait and retry
        if (i < maxRetries - 1) {
          const delay = Math.min(200 * Math.pow(1.5, i), 2000);
          logger.info(`[sync-phone API] User not found yet, waiting ${delay}ms before retry ${i + 2}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error: any) {
        logger.warn(`[sync-phone API] Error on attempt ${i + 1}:`, error?.message || error);
        if (i < maxRetries - 1) {
          const delay = Math.min(200 * Math.pow(1.5, i), 2000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // If we get here, sync failed after all retries
    const elapsed = Date.now() - startTime;
    logger.error(`[sync-phone API] Failed to sync phone after ${maxRetries} attempts (${elapsed}ms)`);
    return NextResponse.json(
      { error: "Failed to sync phone number after multiple attempts" },
      { status: 500 }
    );
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    logger.error(`[sync-phone API] CRITICAL ERROR after ${elapsed}ms:`, error);
    return NextResponse.json(
      { error: error?.message || "Failed to sync phone number" },
      { status: 500 }
    );
  }
}

