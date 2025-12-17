import { NextResponse } from "next/server";
import { getCurrentPrismaUser } from "@/lib/clerk-user-sync";

export async function GET() {
  try {
    // Get current user from Prisma (synced from Clerk)
    const user = await getCurrentPrismaUser();

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id, // Prisma User.id - use this for all business logic
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Session API error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
