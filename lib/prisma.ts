import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null | undefined;
};

// Check if DATABASE_URL is valid before creating client
const hasValidDatabaseUrl = (): boolean => {
  const url = process.env.DATABASE_URL;
  if (!url) return false;
  // Check if it's a valid PostgreSQL URL format (including Prisma Accelerate)
  return (
    url.startsWith("postgresql://") ||
    url.startsWith("postgres://") ||
    url.startsWith("prisma+postgres://") ||
    url.startsWith("prisma+postgresql://")
  );
};

// Only create Prisma client if DATABASE_URL is valid
const createPrismaClient = (): PrismaClient | null => {
  if (!hasValidDatabaseUrl()) {
    return null;
  }
  
  try {
    return new PrismaClient({
      log: [], // Disable all logging to prevent console errors
      errorFormat: "minimal", // Minimal error formatting
    });
  } catch (error) {
    // Silently fail - don't create client if initialization fails
    return null;
  }
};

export const prisma: PrismaClient | null = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}

// Helper function to safely execute Prisma queries
export async function safePrismaQuery<T>(
  query: () => Promise<T>,
  fallback: T
): Promise<T> {
  // Early return if no valid database URL or prisma client
  if (!hasValidDatabaseUrl() || !prisma) {
    return fallback;
  }
  
  try {
    return await query();
  } catch (error: any) {
    // Silently handle all Prisma errors - return fallback
    // Errors are suppressed to allow app to work without database
    // Don't log to avoid console noise
    return fallback;
  }
}
