"use client";

import { useEffect, useState } from "react";

interface PhoneSyncCheckerProps {
  currentPhone: string | null;
}

/**
 * Client component that checks if phone is missing and automatically syncs it
 * This runs after page load to ensure phone is synced from Clerk
 */
export default function PhoneSyncChecker({ currentPhone }: PhoneSyncCheckerProps) {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    // Only sync if phone is missing or empty
    if (!currentPhone || currentPhone.trim().length === 0) {
      setSyncing(true);
      console.log("[PhoneSyncChecker] Phone is missing, attempting to sync from Clerk...");

      // Call sync API route with retry logic
      const attemptSync = async (attempt: number = 1, maxAttempts: number = 3) => {
        try {
          const response = await fetch("/api/user/sync-phone", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`[PhoneSyncChecker] Phone sync successful: ${data.phone || "unknown"}`);
            setSynced(true);
            // Reload page after a short delay to show updated phone
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            const error = await response.json().catch(() => ({}));
            console.warn(`[PhoneSyncChecker] Phone sync failed (attempt ${attempt}/${maxAttempts}): ${error.error || "Unknown error"}`);
            
            // Retry with exponential backoff
            if (attempt < maxAttempts) {
              const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
              console.log(`[PhoneSyncChecker] Retrying in ${delay}ms...`);
              setTimeout(() => {
                attemptSync(attempt + 1, maxAttempts);
              }, delay);
            } else {
              setSyncing(false);
            }
          }
        } catch (error) {
          console.error(`[PhoneSyncChecker] Error syncing phone (attempt ${attempt}/${maxAttempts}):`, error);
          
          // Retry with exponential backoff
          if (attempt < maxAttempts) {
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            console.log(`[PhoneSyncChecker] Retrying in ${delay}ms...`);
            setTimeout(() => {
              attemptSync(attempt + 1, maxAttempts);
            }, delay);
          } else {
            setSyncing(false);
          }
        }
      };

      // Start sync with retries
      attemptSync();
    }
  }, [currentPhone]);

  // Don't render anything - this is a background sync component
  return null;
}

