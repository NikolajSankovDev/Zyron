import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserFromClerk } from "@/lib/clerk-user-sync";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be logged in to update your phone number" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const phone = body.phone?.trim();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!prisma) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 500 }
      );
    }

    // Use getOrCreateUserFromClerk to ensure user exists (handles webhook race condition)
    // Retry a few times in case webhook hasn't created user yet
    let user = null;
    for (let i = 0; i < 10; i++) {
      try {
        // Use the sync function which will create user if it doesn't exist
        user = await getOrCreateUserFromClerk(userId);
        
        if (user) {
          logger.info(`User found/created for phone update (attempt ${i + 1}): ${user.id}`);
          break;
        }
      } catch (syncError) {
        logger.warn(`Error syncing user (attempt ${i + 1}):`, syncError);
      }
      
      // Wait before retrying (longer wait for first few attempts)
      if (!user && i < 9) {
        const waitTime = i < 3 ? 1000 : 500; // 1s for first 3, then 500ms
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    if (!user) {
      logger.error(`User not found/created after retries for userId: ${userId}`);
      return NextResponse.json(
        { error: "User not found. Please try signing in again." },
        { status: 404 }
      );
    }

    // Update phone in Prisma
    try {
      logger.info(`Updating phone for user ${user.id}: ${user.phone} -> ${phone}`);
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { phone: phone },
      });
      
      logger.info(`Successfully updated phone for user ${updatedUser.id}: ${updatedUser.phone}`);
      return NextResponse.json({ success: true, phone: updatedUser.phone });
    } catch (updateError) {
      logger.error("Failed to update phone in database:", updateError as Error);
      return NextResponse.json(
        { error: "Failed to update phone number in database" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error("Failed to update user phone:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update phone number" },
      { status: 500 }
    );
  }
}

