import { NextRequest, NextResponse } from "next/server";
import { verifyClerkWebhook } from "@/lib/clerk";
import { getOrCreateUserFromClerk } from "@/lib/clerk-user-sync";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headers = req.headers;

    // Verify webhook signature
    const event = verifyClerkWebhook(body, headers);

    // Handle different event types
    switch (event.type) {
      case "user.created": {
        const clerkUser = event.data;
        const clerkUserId = clerkUser.id;
        
        // #region agent log
        const webhookEntryLog = JSON.stringify({location:'app/api/webhooks/clerk/route.ts:user.created:entry',message:'Webhook user.created received',data:{clerkUserId,hasPhoneNumbers:!!(clerkUser.phoneNumbers||clerkUser.phone_numbers),hasMetadata:!!(clerkUser.public_metadata||clerkUser.publicMetadata)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'});
        await fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:webhookEntryLog}).catch(()=>{});
        // #endregion
        
        // Extract phone from multiple sources for logging
        const phoneNumbers = clerkUser.phoneNumbers || clerkUser.phone_numbers || [];
        const primaryPhoneId = clerkUser.primaryPhoneNumberId || clerkUser.primary_phone_number_id;
        const primaryPhone = phoneNumbers.find((p: any) => p.id === primaryPhoneId);
        const phoneFromNumbers = primaryPhone?.phoneNumber || primaryPhone?.phone_number || phoneNumbers[0]?.phoneNumber || phoneNumbers[0]?.phone_number || null;
        const phoneFromMetadata = (clerkUser.public_metadata || clerkUser.publicMetadata || {})?.phone;
        
        // #region agent log
        const webhookPhoneLog = JSON.stringify({location:'app/api/webhooks/clerk/route.ts:user.created:phoneExtract',message:'Phone extraction in webhook',data:{clerkUserId,phoneNumbersCount:phoneNumbers.length,phoneFromNumbers:phoneFromNumbers||'none',phoneFromMetadata:phoneFromMetadata||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C'});
        await fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:webhookPhoneLog}).catch(()=>{});
        // #endregion

        logger.info(`[Webhook] user.created for ${clerkUserId}: phoneNumbers count: ${phoneNumbers.length}, phone from numbers: ${phoneFromNumbers || 'none'}, phone from metadata: ${phoneFromMetadata || 'none'}`);

        // Use the helper to sync user to Prisma database
        const user = await getOrCreateUserFromClerk(clerkUserId);
        
        // #region agent log
        const webhookSyncLog = JSON.stringify({location:'app/api/webhooks/clerk/route.ts:user.created:syncResult',message:'Webhook sync result',data:{clerkUserId,prismaUserId:user?.id||'none',phoneAfterSync:user?.phone||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'});
        await fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:webhookSyncLog}).catch(()=>{});
        // #endregion
        
        if (user) {
          logger.info(`[Webhook] Synced new Clerk user to database: ${clerkUserId} -> Prisma user ${user.id}, phone: ${user.phone || 'empty'}`);
          
          // Log phone sync result
          if (user.phone && user.phone.trim().length > 0) {
            if (phoneFromNumbers && user.phone === phoneFromNumbers) {
              logger.info(`✓ Phone successfully synced from phoneNumbers: ${phoneFromNumbers}`);
            } else if (phoneFromMetadata && user.phone === phoneFromMetadata) {
              logger.info(`✓ Phone successfully synced from metadata: ${phoneFromMetadata}`);
            } else {
              logger.warn(`⚠ Phone synced (${user.phone}) but doesn't match expected sources (numbers: ${phoneFromNumbers || 'none'}, metadata: ${phoneFromMetadata || 'none'})`);
            }
          } else {
            // Phone is missing - retry multiple times with increasing delays (metadata might be updating)
            logger.warn(`⚠ User created but phone is empty. Retrying sync with delays...`);
            
            let retrySuccess = false;
            for (let retryAttempt = 0; retryAttempt < 5; retryAttempt++) {
              // Exponential backoff: 1s, 2s, 4s, 8s, 16s
              const delay = Math.pow(2, retryAttempt) * 1000;
              if (retryAttempt > 0) {
                logger.info(`[Webhook] Retry attempt ${retryAttempt + 1}/5: waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
              
              // Retry sync - this will fetch fresh data from Clerk
              try {
                const retryUser = await getOrCreateUserFromClerk(clerkUserId);
                if (retryUser && retryUser.phone && retryUser.phone.trim().length > 0) {
                  logger.info(`✓ Phone successfully synced on retry attempt ${retryAttempt + 1}: ${retryUser.phone}`);
                  retrySuccess = true;
                  break;
                } else {
                  logger.warn(`⚠ Phone still empty after retry attempt ${retryAttempt + 1}`);
                }
              } catch (retryError) {
                logger.error(`[Webhook] Retry sync attempt ${retryAttempt + 1} failed:`, retryError);
              }
            }
            
            if (!retrySuccess) {
              logger.warn(`⚠ Phone still empty after all retries. Will sync via user.updated webhook or API route.`);
            }
          }
        } else {
          logger.error(`[Webhook] Failed to sync new Clerk user to database: ${clerkUserId}`);
        }

        break;
      }

      case "user.updated": {
        const clerkUser = event.data;
        const clerkUserId = clerkUser.id;

        // Extract phone from multiple sources for logging
        const phoneNumbers = clerkUser.phoneNumbers || clerkUser.phone_numbers || [];
        const primaryPhoneId = clerkUser.primaryPhoneNumberId || clerkUser.primary_phone_number_id;
        const primaryPhone = phoneNumbers.find((p: any) => p.id === primaryPhoneId);
        const phoneFromNumbers = primaryPhone?.phoneNumber || primaryPhone?.phone_number || phoneNumbers[0]?.phoneNumber || phoneNumbers[0]?.phone_number || null;
        const phoneFromMetadata = (clerkUser.public_metadata || clerkUser.publicMetadata || {})?.phone;
        
        logger.info(`[Webhook] user.updated for ${clerkUserId}: phoneNumbers count: ${phoneNumbers.length}, phone from numbers: ${phoneFromNumbers || 'none'}, phone from metadata: ${phoneFromMetadata || 'none'}`);
        
        // Get existing user to check previous phone value
        let previousPhone: string | null = null;
        if (prisma) {
          const existingUser = await prisma.user.findUnique({
            where: { clerkUserId: clerkUserId },
            select: { phone: true },
          });
          previousPhone = existingUser?.phone || null;
        }
        
        // Use the helper to update user in Prisma database
        // This will sync phone from phoneNumbers or metadata if available
        const user = await getOrCreateUserFromClerk(clerkUserId);
        
        if (user) {
          logger.info(`[Webhook] Updated Clerk user in database: ${clerkUserId} -> Prisma user ${user.id}, previous phone: ${previousPhone || 'empty'}, current phone: ${user.phone || 'empty'}`);
          
          // Log phone sync result
          if (user.phone && user.phone.trim().length > 0) {
            const phoneWasUpdated = previousPhone !== user.phone;
            if (phoneWasUpdated) {
              if (phoneFromNumbers && user.phone === phoneFromNumbers) {
                logger.info(`✓ Phone successfully updated from phoneNumbers: ${previousPhone || 'empty'} -> ${phoneFromNumbers}`);
              } else if (phoneFromMetadata && user.phone === phoneFromMetadata) {
                logger.info(`✓ Phone successfully updated from metadata: ${previousPhone || 'empty'} -> ${phoneFromMetadata}`);
              } else {
                logger.info(`✓ Phone updated: ${previousPhone || 'empty'} -> ${user.phone} (source: ${phoneFromNumbers || phoneFromMetadata || 'unknown'})`);
              }
            } else {
              logger.info(`Phone unchanged: ${user.phone}`);
            }
          } else {
            // Phone is empty - log warning but don't overwrite existing phone
            if (previousPhone && previousPhone.trim().length > 0) {
              logger.warn(`⚠ Clerk has no phone but Prisma user has phone (${previousPhone}). Preserving existing phone.`);
            } else {
              logger.warn(`⚠ User updated but phone is still empty.`);
            }
          }
        } else {
          logger.error(`[Webhook] Failed to update Clerk user in database: ${clerkUserId}`);
        }

        break;
      }

      case "user.deleted": {
        const clerkUser = event.data;
        const clerkUserId = clerkUser.id;

        // Delete user from Prisma database
        if (prisma) {
          try {
            await prisma.user.deleteMany({
              where: { clerkUserId: clerkUserId },
            });

            logger.info(`Deleted Clerk user from database: ${clerkUserId}`);
          } catch (error) {
            logger.error(`Failed to delete Clerk user from database: ${clerkUserId}`, error as Error);
          }
        }

        break;
      }

      default:
        logger.info(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Webhook error:", error as Error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}

