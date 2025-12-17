"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPrismaUser, getOrCreateUserFromClerk } from "@/lib/clerk-user-sync";
import { updateClerkUserMetadata, getClerkUser } from "@/lib/clerk";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { createClerkClient } from "@clerk/nextjs/server";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
});

/**
 * Update user profile (name and phone)
 */
export async function updateProfile(formData: FormData) {
  try {
    const user = await getCurrentPrismaUser();

    if (!user) {
      return {
        error: "You must be logged in to update your profile",
      };
    }

    if (!prisma) {
      return {
        error: "Database not available",
      };
    }

    const rawData = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
    };

    const validated = updateProfileSchema.safeParse(rawData);

    if (!validated.success) {
      return {
        error: validated.error.errors[0]?.message || "Invalid profile data",
      };
    }

    const { name, phone } = validated.data;

    // Update in Prisma
    try {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name.trim(),
          phone: phone.trim(),
          updatedAt: new Date(),
        },
      });

      logger.info(`Updated profile for user ${user.id}: name="${name}", phone="${phone}"`);

      // Also update Clerk metadata to keep it in sync
      try {
        const { userId } = await auth();
        if (userId) {
          await updateClerkUserMetadata(userId, {
            phone: phone.trim(),
          });
          logger.info(`Updated Clerk metadata for user ${userId}`);
        }
      } catch (metadataError) {
        // Don't fail if metadata update fails - Prisma is the source of truth
        logger.warn(`Failed to update Clerk metadata:`, metadataError);
      }

      revalidatePath("/account");
      revalidatePath("/account/profile");

      return { success: true };
    } catch (updateError) {
      logger.error("Failed to update profile in database:", updateError as Error);
      return {
        error: "Failed to update profile",
      };
    }
  } catch (error: any) {
    logger.error("Failed to update profile:", error);
    return {
      error: error?.message || "Failed to update profile",
    };
  }
}

/**
 * Store phone number in Clerk's publicMetadata
 * This is called during sign-up so the webhook can read it
 */
export async function storePhoneInClerkMetadata(phone: string) {
  const { userId } = await auth();

  if (!userId) {
    return {
      error: "You must be logged in to store phone number",
    };
  }

  if (!phone || !phone.trim()) {
    return {
      error: "Phone number is required",
    };
  }

  try {
    await updateClerkUserMetadata(userId, {
      phone: phone.trim(),
    });
    
    // Also update Prisma directly to ensure phone is saved immediately
    try {
      const prismaUser = await prisma?.user.findFirst({
        where: { clerkUserId: userId },
      });
      
      if (prismaUser) {
        await prisma.user.update({
          where: { id: prismaUser.id },
          data: { phone: phone.trim() },
        });
        logger.info(`Updated Prisma phone for user ${prismaUser.id}: ${phone.trim()}`);
      }
    } catch (prismaError) {
      // Don't fail the whole operation if Prisma update fails - metadata is already stored
      logger.warn("Failed to update Prisma user phone:", prismaError);
    }
    
    return { success: true };
  } catch (error: any) {
    logger.error("Failed to store phone in Clerk metadata:", error);
    return {
      error: error.message || "Failed to store phone number",
    };
  }
}

/**
 * Save phone number immediately after sign-up
 * This is called synchronously after sign-up to ensure phone is saved before webhook processes
 * Updates both Clerk metadata AND Prisma directly with aggressive retries
 */
export async function savePhoneAfterSignUp(phone: string): Promise<{ success?: boolean; error?: string; details?: string }> {
  const startTime = Date.now();
  // #region agent log
  const entryLog = JSON.stringify({location:'lib/actions/user.ts:savePhoneAfterSignUp:entry',message:'Function entry',data:{phone:phone?.substring(0,10)||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,E'});
  await fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:entryLog}).catch(()=>{});
  // #endregion
  logger.info(`[savePhoneAfterSignUp] Starting phone save process for phone: ${phone?.substring(0, 5)}...`);

  try {
    if (!phone || !phone.trim()) {
      return {
        error: "Phone number is required",
      };
    }

    const phoneTrimmed = phone.trim();

    // Get userId - try multiple methods
    let userId: string | null = null;
    
    // Method 1: Try auth() first
    try {
      const authResult = await auth();
      userId = authResult.userId || null;
      logger.info(`[savePhoneAfterSignUp] Got userId from auth(): ${userId || 'null'}`);
    } catch (authError) {
      logger.warn(`[savePhoneAfterSignUp] auth() failed:`, authError);
    }

    // Method 2: Try currentUser() if auth() didn't work
    if (!userId) {
      try {
        const user = await currentUser();
        userId = user?.id || null;
        logger.info(`[savePhoneAfterSignUp] Got userId from currentUser(): ${userId || 'null'}`);
      } catch (userError) {
        logger.warn(`[savePhoneAfterSignUp] currentUser() failed:`, userError);
      }
    }

    if (!userId) {
      logger.error(`[savePhoneAfterSignUp] Could not get userId from auth() or currentUser()`);
      return {
        error: "Could not determine user ID. Please try again.",
        details: "User session not available immediately after sign-up",
      };
    }

    logger.info(`[savePhoneAfterSignUp] Using userId: ${userId}`);

    // Step 1: Update Clerk metadata FIRST (so webhook can pick it up) - with retries
    let metadataUpdated = false;
    for (let i = 0; i < 5; i++) {
      try {
        // #region agent log
        const metadataAttemptLog = JSON.stringify({location:'lib/actions/user.ts:savePhoneAfterSignUp:metadataAttempt',message:'Attempting metadata update',data:{userId,phone:phoneTrimmed,attempt:i+1},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'});
        await fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:metadataAttemptLog}).catch(()=>{});
        // #endregion
        await updateClerkUserMetadata(userId, {
          phone: phoneTrimmed,
        });
        // #region agent log
        const metadataSuccessLog = JSON.stringify({location:'lib/actions/user.ts:savePhoneAfterSignUp:metadataSuccess',message:'Metadata update successful',data:{userId,phone:phoneTrimmed,attempt:i+1},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'});
        await fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:metadataSuccessLog}).catch(()=>{});
        // #endregion
        logger.info(`[savePhoneAfterSignUp] ✓ Updated Clerk metadata for ${userId} with phone: ${phoneTrimmed} (attempt ${i + 1})`);
        metadataUpdated = true;
        break;
      } catch (metadataError: any) {
        // #region agent log
        const metadataErrorLog = JSON.stringify({location:'lib/actions/user.ts:savePhoneAfterSignUp:metadataError',message:'Metadata update failed',data:{userId,phone:phoneTrimmed,attempt:i+1,error:metadataError?.message||'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'});
        await fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:metadataErrorLog}).catch(()=>{});
        // #endregion
        logger.warn(`[savePhoneAfterSignUp] Failed to update Clerk metadata (attempt ${i + 1}):`, metadataError?.message || metadataError);
        if (i < 4) {
          // Exponential backoff: 200ms, 400ms, 800ms, 1600ms
          await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, i)));
        }
      }
    }

    if (!metadataUpdated) {
      logger.error(`[savePhoneAfterSignUp] Failed to update Clerk metadata after 5 attempts`);
      // Continue anyway - we'll try to update Prisma directly
    }

    // Step 2: Update Prisma directly with AGGRESSIVE retries (exponential backoff up to 5 seconds)
    if (!prisma) {
      logger.error(`[savePhoneAfterSignUp] Prisma client not available`);
      return {
        error: "Database not available",
      };
    }

    let prismaUser = null;
    const maxRetries = 15; // More retries for reliability
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Try to find user by clerkUserId
        prismaUser = await prisma.user.findUnique({
          where: { clerkUserId: userId },
        });

        if (prismaUser) {
          // #region agent log
          const prismaUpdateLog = JSON.stringify({location:'lib/actions/user.ts:savePhoneAfterSignUp:prismaUpdate',message:'Updating Prisma user phone',data:{userId,prismaUserId:prismaUser.id,phoneBefore:prismaUser.phone||'none',phoneAfter:phoneTrimmed,attempt:i+1},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'});
          await fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:prismaUpdateLog}).catch(()=>{});
          // #endregion
          // User exists, update phone
          await prisma.user.update({
            where: { id: prismaUser.id },
            data: { phone: phoneTrimmed },
          });
          const elapsed = Date.now() - startTime;
          // #region agent log
          const prismaSuccessLog = JSON.stringify({location:'lib/actions/user.ts:savePhoneAfterSignUp:prismaSuccess',message:'Prisma update successful',data:{userId,prismaUserId:prismaUser.id,phone:phoneTrimmed,attempt:i+1,elapsed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'});
          await fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:prismaSuccessLog}).catch(()=>{});
          // #endregion
          logger.info(`[savePhoneAfterSignUp] ✓✓✓ SUCCESS: Updated Prisma user ${prismaUser.id} with phone: ${phoneTrimmed} (attempt ${i + 1}, ${elapsed}ms)`);
          return { 
            success: true,
            details: `Phone saved to Prisma after ${i + 1} attempts in ${elapsed}ms`
          };
        }
        
        // #region agent log
        const prismaNotFoundLog = JSON.stringify({location:'lib/actions/user.ts:savePhoneAfterSignUp:prismaNotFound',message:'Prisma user not found yet',data:{userId,attempt:i+1},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'});
        await fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:prismaNotFoundLog}).catch(()=>{});
        // #endregion

        // If user doesn't exist yet, wait and retry (webhook might still be processing)
        if (i < maxRetries - 1) {
          // Exponential backoff: starts at 200ms, max 2000ms
          const delay = Math.min(200 * Math.pow(1.5, i), 2000);
          logger.info(`[savePhoneAfterSignUp] User not found yet, waiting ${delay}ms before retry ${i + 2}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error: any) {
        logger.warn(`[savePhoneAfterSignUp] Error on attempt ${i + 1}:`, error?.message || error);
        if (i < maxRetries - 1) {
          const delay = Math.min(200 * Math.pow(1.5, i), 2000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // If we get here, user wasn't created yet after all retries
    // But metadata is updated, so webhook will sync it
    const elapsed = Date.now() - startTime;
    logger.warn(`[savePhoneAfterSignUp] Prisma user not found after ${maxRetries} attempts (${elapsed}ms), but metadata is ${metadataUpdated ? 'updated' : 'NOT updated'}. Webhook will sync.`);
    return { 
      success: metadataUpdated, // Success if metadata was updated
      details: metadataUpdated 
        ? `Metadata updated, Prisma sync pending (webhook will handle)`
        : `Failed to update both metadata and Prisma after ${maxRetries} attempts`
    };
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    logger.error(`[savePhoneAfterSignUp] CRITICAL ERROR after ${elapsed}ms:`, error);
    return {
      error: error?.message || "Failed to save phone number",
      details: `Error occurred: ${error?.stack || error}`
    };
  }
}

/**
 * Update user phone number after sign-up
 * This is called after Clerk sign-up is complete, since phone number
 * authentication may not be enabled in Clerk dashboard
 */
export async function updateUserPhone(phone: string): Promise<{ success?: boolean; error?: string }> {
  try {
    if (!phone || !phone.trim()) {
      return {
        error: "Phone number is required",
      };
    }

    // Use getCurrentPrismaUser instead of auth() directly - it handles auth internally
    const user = await getCurrentPrismaUser();

    if (!user) {
      return {
        error: "You must be logged in to update your phone number",
      };
    }

    if (!prisma) {
      return {
        error: "Database not available",
      };
    }

    // Update phone in Prisma
    try {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { phone: phone.trim() },
      });

      logger.info(`Updated phone for user ${updatedUser.id}: ${updatedUser.phone}`);

      return { success: true };
    } catch (updateError) {
      logger.error("Failed to update phone in database:", updateError);
      return {
        error: "Failed to update phone number in database",
      };
    }
  } catch (error: any) {
    logger.error("Failed to update user phone:", error);
    return {
      error: error?.message || "Failed to update phone number",
    };
  }
}
