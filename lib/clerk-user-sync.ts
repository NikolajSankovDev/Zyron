/**
 * Clerk User Synchronization
 * 
 * This module handles syncing Clerk user data to Prisma database.
 * Clerk is used ONLY for authentication; Prisma is the source of truth for business data.
 */

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { formatClerkUser, getClerkUser } from "@/lib/clerk";
import type { UserRole } from "@prisma/client";

/**
 * Get or create a Prisma User from Clerk user data
 * 
 * This is the canonical way to sync Clerk authentication data to Prisma.
 * All business logic should use the returned Prisma User.id, not Clerk user ID.
 * 
 * @param clerkUserId - The Clerk user ID from auth()
 * @returns Prisma User object, or null if Clerk user not found or database unavailable
 */
export async function getOrCreateUserFromClerk(
  clerkUserId: string
): Promise<{ id: string; email: string; name: string; phone: string; role: UserRole; clerkUserId: string | null } | null> {
  // #region agent log
  const entryLog = JSON.stringify({location:'lib/clerk-user-sync.ts:getOrCreateUserFromClerk:entry',message:'Function entry',data:{clerkUserId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,D'});
  await fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:entryLog}).catch(()=>{});
  // #endregion
  
  if (!prisma) {
    logger.error("Prisma client not available for user sync");
    return null;
  }

  try {
    // First, try to find existing user by clerkUserId
    let user = await prisma.user.findUnique({
      where: { clerkUserId },
    });
    
    // #region agent log
    const foundLog = JSON.stringify({location:'lib/clerk-user-sync.ts:getOrCreateUserFromClerk:found',message:'User lookup result',data:{clerkUserId,userExists:!!user,existingPhone:user?.phone||'none',existingId:user?.id||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,D'});
    await fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:foundLog}).catch(()=>{});
    // #endregion

    if (user) {
      // User exists, sync data from Clerk including phone number
      const clerkUser = await getClerkUser(clerkUserId);
      const formattedUser = formatClerkUser(clerkUser);
      
      // #region agent log
      const clerkDataLog = JSON.stringify({location:'lib/clerk-user-sync.ts:getOrCreateUserFromClerk:clerkData',message:'Clerk user data extracted',data:{clerkUserId,phoneFromFormatted:formattedUser.phone||'none',emailFromFormatted:formattedUser.email||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C,D'});
      await fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:clerkDataLog}).catch(()=>{});
      // #endregion
      
      // Extract phone from formatted user (formatClerkUser already extracts from metadata)
      // Use phone from Clerk if it's non-empty, otherwise preserve existing phone
      const phoneFromClerk = formattedUser.phone && formattedUser.phone.trim().length > 0
        ? formattedUser.phone.trim()
        : null;
      
      // #region agent log
      const phoneExtractLog = JSON.stringify({location:'lib/clerk-user-sync.ts:getOrCreateUserFromClerk:phoneExtract',message:'Phone extraction logic',data:{clerkUserId,phoneFromClerk:phoneFromClerk||'none',currentPhone:user.phone||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C,D'});
      await fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:phoneExtractLog}).catch(()=>{});
      // #endregion
      
      const currentPhone = user.phone || "";
      const currentPhoneEmpty = !currentPhone || currentPhone.trim().length === 0;
      
      logger.info(`[getOrCreateUserFromClerk] Updating existing user ${user.id}: current phone: "${currentPhone}" (empty: ${currentPhoneEmpty}), phone from Clerk: ${phoneFromClerk || 'none'}`);
      
      // Determine final phone value:
      // - If Clerk has a phone and it's different from current, use Clerk's phone
      // - If current phone is empty/missing and Clerk has one, use Clerk's phone
      // - Otherwise, preserve existing phone (never overwrite with empty)
      let finalPhone = currentPhone;
      if (phoneFromClerk) {
        // Always update if we have a phone from Clerk and it's different
        // This ensures phone from metadata (stored during sign-up) gets saved
        if (phoneFromClerk !== currentPhone) {
          finalPhone = phoneFromClerk;
          logger.info(`[getOrCreateUserFromClerk] Phone will be updated: "${currentPhone}" -> "${phoneFromClerk}"`);
        } else {
          logger.info(`[getOrCreateUserFromClerk] Phone unchanged: "${currentPhone}"`);
        }
      } else {
        if (currentPhoneEmpty) {
          logger.warn(`[getOrCreateUserFromClerk] No phone from Clerk and current phone is empty - preserving empty phone`);
        } else {
          logger.info(`[getOrCreateUserFromClerk] No phone from Clerk - preserving existing phone: "${currentPhone}"`);
        }
      }
      
      // Update user with synced data
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: formattedUser.email,
          name: formattedUser.fullName || 
                (formattedUser.firstName && formattedUser.lastName 
                  ? `${formattedUser.firstName} ${formattedUser.lastName}`.trim()
                  : formattedUser.email),
          phone: finalPhone,
          role: (formattedUser.role as UserRole) || user.role,
          updatedAt: new Date(),
        },
      });
      
      // #region agent log
      const updateLog = JSON.stringify({location:'lib/clerk-user-sync.ts:getOrCreateUserFromClerk:update',message:'User updated in Prisma',data:{clerkUserId,prismaUserId:user.id,phoneAfterUpdate:user.phone||'none',finalPhone:finalPhone||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,D'});
      await fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:updateLog}).catch(()=>{});
      // #endregion
      
      logger.info(`[getOrCreateUserFromClerk] Updated existing user for Clerk ID ${clerkUserId}: ${user.id}, phone: "${user.phone}"`);
      return user;
    }

    logger.info(`User not found for Clerk ID ${clerkUserId}, creating new user...`);
    
    // User doesn't exist by clerkUserId, fetch from Clerk
    const clerkUser = await getClerkUser(clerkUserId);
    const formattedUser = formatClerkUser(clerkUser);
    
    // #region agent log
    const createClerkDataLog = JSON.stringify({location:'lib/clerk-user-sync.ts:getOrCreateUserFromClerk:createClerkData',message:'Clerk data for new user',data:{clerkUserId,phoneFromFormatted:formattedUser.phone||'none',emailFromFormatted:formattedUser.email||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'});
    await fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:createClerkDataLog}).catch(()=>{});
    // #endregion

    // Check if user exists by email (might have been created before Clerk integration)
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: formattedUser.email },
    });

    // Extract name from Clerk (firstName + lastName or fullName)
    const name = formattedUser.fullName || 
                 (formattedUser.firstName && formattedUser.lastName 
                   ? `${formattedUser.firstName} ${formattedUser.lastName}`.trim()
                   : formattedUser.email);

    // Extract phone from Clerk
    // formatClerkUser already extracts phone from publicMetadata and phoneNumbers
    // Use the phone from formattedUser, defaulting to empty string if not available
    const phoneFromClerk = formattedUser.phone && formattedUser.phone.trim().length > 0
      ? formattedUser.phone.trim()
      : "";
    
    // #region agent log
    const createPhoneLog = JSON.stringify({location:'lib/clerk-user-sync.ts:getOrCreateUserFromClerk:createPhone',message:'Phone for new user creation',data:{clerkUserId,phoneFromClerk:phoneFromClerk||'empty',email:formattedUser.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'});
    await fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:createPhoneLog}).catch(()=>{});
    // #endregion

    logger.info(`[getOrCreateUserFromClerk] Creating/updating user for Clerk ID ${clerkUserId}, email: ${formattedUser.email}, phone from Clerk: ${phoneFromClerk || 'empty'}`);

    // Get role from Clerk metadata or default to CUSTOMER
    const role = (formattedUser.role as UserRole) || "CUSTOMER";

    if (existingUserByEmail) {
      // User exists by email but doesn't have clerkUserId set - update it
      logger.info(`[getOrCreateUserFromClerk] Found existing user by email ${formattedUser.email}, updating clerkUserId`);
      // Use phone from Clerk if available and existing phone is empty, otherwise preserve existing
      const existingPhone = existingUserByEmail.phone || "";
      const existingPhoneEmpty = !existingPhone || existingPhone.trim().length === 0;
      const preservedPhone = existingPhoneEmpty && phoneFromClerk
        ? phoneFromClerk
        : existingPhone;
      
      logger.info(`[getOrCreateUserFromClerk] Preserving phone for existing user: "${existingPhone}" (empty: ${existingPhoneEmpty}) -> "${preservedPhone}"`);
      
      user = await prisma.user.update({
        where: { id: existingUserByEmail.id },
        data: {
          clerkUserId: clerkUserId,
          email: formattedUser.email,
          name: name,
          phone: preservedPhone,
          role: role,
          updatedAt: new Date(),
        },
      });
      
      logger.info(`[getOrCreateUserFromClerk] Updated existing user by email: ${user.id}, phone: "${user.phone}"`);
    } else {
      // Create new user - handle race conditions gracefully
      // If webhook and getCurrentPrismaUser both try to create at the same time,
      // catch the unique constraint error and fetch the existing user
      logger.info(`[getOrCreateUserFromClerk] Creating new user for Clerk ID ${clerkUserId} and email ${formattedUser.email}, phone: "${phoneFromClerk}"`);
      try {
        user = await prisma.user.create({
          data: {
            clerkUserId: clerkUserId,
            email: formattedUser.email,
            name: name,
            phone: phoneFromClerk,
            role: role,
          },
        });
        
        // #region agent log
        const createSuccessLog = JSON.stringify({location:'lib/clerk-user-sync.ts:getOrCreateUserFromClerk:createSuccess',message:'New user created in Prisma',data:{clerkUserId,prismaUserId:user.id,phoneAfterCreate:user.phone||'none',phoneFromClerk:phoneFromClerk||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'});
        await fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:createSuccessLog}).catch(()=>{});
        // #endregion
        
        logger.info(`[getOrCreateUserFromClerk] Created new user for Clerk ID ${clerkUserId}: ${user.id}, phone: "${user.phone}"`);
      } catch (createError: any) {
        // Handle race condition: if user was created by webhook between our check and create
        if (createError?.code === 'P2002' && createError?.meta?.target?.includes('email')) {
          logger.info(`User with email ${formattedUser.email} already exists (race condition), fetching...`);
          // Try to find by email first
          user = await prisma.user.findUnique({
            where: { email: formattedUser.email },
          });
          
          // If found by email but doesn't have clerkUserId, update it
          if (user && !user.clerkUserId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                clerkUserId: clerkUserId,
                updatedAt: new Date(),
              },
            });
          }
          
          // If still not found, try by clerkUserId (might have been created by webhook)
          if (!user) {
            user = await prisma.user.findUnique({
              where: { clerkUserId },
            });
          }
          
          if (!user) {
            throw new Error(`Failed to find user after race condition: ${formattedUser.email}`);
          }
        } else {
          // Re-throw if it's not a unique constraint error
          throw createError;
        }
      }
    }

    logger.info(`Synced Clerk user ${clerkUserId} to Prisma user ${user.id}`);
    return user;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error(`Failed to get or create user from Clerk ${clerkUserId}:`, error as Error);
    console.error('Full error details:', {
      message: errorMessage,
      stack: errorStack,
      error: error
    });
    return null;
  }
}

/**
 * Get the current authenticated user's Prisma User record
 * 
 * This helper gets the Clerk userId from auth() and syncs it to Prisma.
 * Use this in server components and server actions to get the Prisma User.
 * 
 * @returns Prisma User object, or null if not authenticated or sync fails
 */
export async function getCurrentPrismaUser() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      logger.info('No Clerk userId found in auth()');
      return null;
    }

    logger.info(`Getting Prisma user for Clerk userId: ${userId}`);
    return await getOrCreateUserFromClerk(userId);
  } catch (error) {
    logger.error('Error in getCurrentPrismaUser:', error as Error);
    return null;
  }
}

