import { NextRequest, NextResponse } from "next/server";
import { safePrismaQuery, prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const barbers = await safePrismaQuery(
    async () => {
      if (!prisma) return [];
      return await prisma.barber.findMany({
        where: {
          active: true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          displayName: "asc",
        },
      });
    },
    []
  );

  return NextResponse.json({ barbers });
}


