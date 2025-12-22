import { getCurrentPrismaUser } from "@/lib/clerk-user-sync";

/**
 * Get the current session with user information
 * 
 * This function wraps getCurrentPrismaUser() to provide a session-like interface
 * that matches the expected format used in admin pages.
 * 
 * @returns Session object with user property, or null if not authenticated
 */
export async function getSession() {
  const user = await getCurrentPrismaUser();
  
  if (!user) {
    return null;
  }
  
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      clerkUserId: user.clerkUserId,
    },
  };
}

