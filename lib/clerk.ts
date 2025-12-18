import { logger } from '@/lib/logger'
import { type WebhookEvent, createClerkClient } from '@clerk/nextjs/server'
import { Webhook } from 'svix'

// Creating a Clerk Client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY || '',
})

// Clerk webhook signature verification
export function verifyClerkWebhook(
  body: string,
  headers: Headers
): WebhookEvent {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error(
      'CLERK_WEBHOOK_SECRET environment variable is not configured'
    )
  }

  // Get Svix signature headers
  const svixId = headers.get('svix-id')
  const svixTimestamp = headers.get('svix-timestamp')
  const svixSignature = headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error('Missing Svix signature headers')
  }

  try {
    const webhook = new Webhook(webhookSecret)
    const event = webhook.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent

    return event
  } catch (error) {
    logger.error('Clerk webhook signature verification failed:', error as Error)
    throw new Error('Invalid webhook signature')
  }
}

// Get user information
export async function getClerkUser(userId: string) {
  try {
    const user = await clerkClient.users.getUser(userId)
    return user
  } catch (error) {
    logger.error(`Failed to obtain Clerk user: ${userId}`, error as Error)
    throw error
  }
}

// Update user metadata
export async function updateClerkUserMetadata(
  userId: string,
  metadata: Record<string, any>
) {
  try {
    // Get current user to preserve existing metadata
    const currentUser = await clerkClient.users.getUser(userId)
    const existingMetadata = (currentUser.publicMetadata || {}) as Record<string, any>
    
    // Merge new metadata with existing metadata
    const mergedMetadata = {
      ...existingMetadata,
      ...metadata,
    }
    
    const user = await clerkClient.users.updateUser(userId, {
      publicMetadata: mergedMetadata,
    })

    logger.info(`Successfully updated Clerk user metadata: ${userId}`)
    return user
  } catch (error) {
    logger.error(
      `Failed to update Clerk user metadata: ${userId}`,
      error as Error
    )
    throw error
  }
}

// Delete user
export async function deleteClerkUser(userId: string) {
  try {
    await clerkClient.users.deleteUser(userId)
    logger.info(`Successfully deleted Clerk user: ${userId}`)
  } catch (error) {
    logger.error(`Failed to delete Clerk user: ${userId}`, error as Error)
    throw error
  }
}

// Revoke all active Clerk sessions for a user (safe to call before deletion)
export async function revokeClerkUserSessions(userId: string) {
  try {
    const sessions = await clerkClient.sessions.getSessionList({ userId })
    let revoked = 0

    for (const session of sessions) {
      await clerkClient.sessions.revokeSession(session.id)
      revoked++
    }

    logger.info(`Revoked ${revoked} Clerk session(s) for user: ${userId}`)
  } catch (error) {
    logger.error(`Failed to revoke Clerk sessions for user: ${userId}`, error as Error)
    throw error
  }
}

// Set user role
export async function setClerkUserRole(userId: string, role: string) {
  try {
    const user = await clerkClient.users.updateUser(userId, {
      publicMetadata: { role },
    })

    logger.info(`Successfully set the Clerk user role: ${userId} -> ${role}`)
    return user
  } catch (error) {
    logger.error(`Failed to set Clerk user role: ${userId}`, error as Error)
    throw error
  }
}

// Format Clerk user data
export function formatClerkUser(clerkUser: any) {
  try {
    // Safe date parsing function
    const parseDate = (timestamp: any): Date => {
      if (!timestamp) return new Date()

      if (typeof timestamp === 'number') {
        const date = new Date(timestamp)
        return isNaN(date.getTime()) ? new Date() : date
      }

      if (typeof timestamp === 'string') {
        const date = new Date(timestamp)
        return isNaN(date.getTime()) ? new Date() : date
      }

      if (timestamp instanceof Date) {
        return isNaN(timestamp.getTime()) ? new Date() : timestamp
      }

      return new Date()
    }

    // Extract basic user information
    // Handle both camelCase (from Clerk SDK) and snake_case (from webhook) formats
    const primaryEmailId = clerkUser.primaryEmailAddressId || clerkUser.primary_email_address_id
    const emailAddresses = clerkUser.emailAddresses || clerkUser.email_addresses || []
    
    const primaryEmail = emailAddresses.find(
      (email: any) => email.id === primaryEmailId
    )
    // Try all possible email field names
    const email =
      primaryEmail?.emailAddress || 
      primaryEmail?.email_address ||
      emailAddresses[0]?.emailAddress ||
      emailAddresses[0]?.email_address ||
      (emailAddresses.length > 0 && typeof emailAddresses[0] === 'string' ? emailAddresses[0] : '') ||
      ''

    // Extract phone number
    // Handle both camelCase (from Clerk SDK) and snake_case (from webhook) formats
    const primaryPhoneId = clerkUser.primaryPhoneNumberId || clerkUser.primary_phone_number_id
    const phoneNumbers = clerkUser.phoneNumbers || clerkUser.phone_numbers || []
    
    // #region agent log
    const phoneExtractEntryLog = JSON.stringify({location:'lib/clerk.ts:formatClerkUser:phoneExtractEntry',message:'Starting phone extraction',data:{clerkUserId:clerkUser.id,phoneNumbersLength:phoneNumbers.length,primaryPhoneId:primaryPhoneId||'none',phoneNumbersArray:JSON.stringify(phoneNumbers)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'});
    fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:phoneExtractEntryLog}).catch(()=>{});
    // #endregion
    
    logger.info(`[formatClerkUser] Extracting phone for user ${clerkUser.id}: phoneNumbers array length: ${phoneNumbers.length}, primaryPhoneId: ${primaryPhoneId || 'none'}`)
    
    const primaryPhone = phoneNumbers.find(
      (phone: any) => phone.id === primaryPhoneId
    )
    // Extract phone from phoneNumbers first, then fall back to publicMetadata
    const phoneFromNumbers =
      primaryPhone?.phoneNumber ||
      primaryPhone?.phone_number ||
      phoneNumbers[0]?.phoneNumber ||
      phoneNumbers[0]?.phone_number ||
      null
    
    if (phoneFromNumbers) {
      logger.info(`[formatClerkUser] Found phone from phoneNumbers array: ${phoneFromNumbers}`)
    } else {
      logger.info(`[formatClerkUser] No phone found in phoneNumbers array`)
    }
    
    // Fall back to publicMetadata.phone if phoneNumbers is empty
    // Handle both camelCase (from SDK) and snake_case (from webhook) formats
    const publicMetadata = clerkUser.publicMetadata || clerkUser.public_metadata || {}
    // Properly extract phone from metadata - handle both string and object formats
    let phoneFromMetadata: string | null = null
    if (publicMetadata && typeof publicMetadata === 'object') {
      const metadataPhone = (publicMetadata as any)?.phone
      // Ensure it's a non-empty string
      if (metadataPhone && typeof metadataPhone === 'string' && metadataPhone.trim().length > 0) {
        phoneFromMetadata = metadataPhone.trim()
        logger.info(`[formatClerkUser] Found phone from publicMetadata: ${phoneFromMetadata}`)
      } else {
        logger.info(`[formatClerkUser] No valid phone in publicMetadata (value: ${metadataPhone}, type: ${typeof metadataPhone})`)
      }
    } else {
      logger.info(`[formatClerkUser] publicMetadata is not an object or is missing`)
    }
    
    const phone = phoneFromNumbers || phoneFromMetadata || null
    
    // #region agent log
    const phoneFinalLog = JSON.stringify({location:'lib/clerk.ts:formatClerkUser:phoneFinal',message:'Final phone extraction result',data:{clerkUserId:clerkUser.id,phoneFromNumbers:phoneFromNumbers||'none',phoneFromMetadata:phoneFromMetadata||'none',finalPhone:phone||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'});
    fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:phoneFinalLog}).catch(()=>{});
    // #endregion
    
    if (phone) {
      logger.info(`[formatClerkUser] Final extracted phone: ${phone}`)
    } else {
      logger.warn(`[formatClerkUser] No phone found in any source for user ${clerkUser.id}`)
    }

    // Extract name - handle both formats
    const firstName = clerkUser.firstName || clerkUser.first_name || ''
    const lastName = clerkUser.lastName || clerkUser.last_name || ''

    const formattedUser = {
      id: clerkUser.id,
      email: email,
      fullName: `${firstName} ${lastName}`.trim() || null,
      firstName: firstName || null,
      lastName: lastName || null,
      phone: phone,
      avatarUrl: clerkUser.image_url || clerkUser.profile_image_url || null,
      isActive: true,
      role: (clerkUser.publicMetadata || clerkUser.public_metadata || {})?.role || 'CUSTOMER',
      publicMetadata: clerkUser.publicMetadata || clerkUser.public_metadata || {},
      privateMetadata: clerkUser.privateMetadata || clerkUser.private_metadata || {},
      createdAt: parseDate(clerkUser.created_at),
      updatedAt: parseDate(clerkUser.updated_at),
      lastSignInAt: parseDate(clerkUser.last_sign_in_at),
      lastActiveAt: parseDate(clerkUser.last_active_at),
    }

    // Validate required fields
    if (!formattedUser.id) {
      throw new Error('Clerk user ID is required')
    }

    if (!formattedUser.email) {
      throw new Error('Clerk user email is required')
    }

    return formattedUser
  } catch (error) {
    logger.error('Failed to format Clerk user data:', error as Error)
    logger.error('Original Clerk user data: ' + JSON.stringify(clerkUser))
    throw error
  }
}

// Get Clerk user role
export function getClerkUserRole(user: any): string {
  return user?.publicMetadata?.role || 'CUSTOMER'
}

// Check if user is admin
export function isClerkAdmin(user: any): boolean {
  const role = getClerkUserRole(user)
  return role === 'ADMIN' || role === 'BARBER'
}
