import { NextRequest, NextResponse } from "next/server";
import { safePrismaQuery, prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ customers: [] });
  }

  const searchTerm = query.trim().toLowerCase();

  const customers = await safePrismaQuery(
    async () => {
      if (!prisma) return [];
      return await prisma.user.findMany({
        where: {
          role: "CUSTOMER",
          OR: [
            {
              name: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
        take: 10, // Limit to 10 results
        orderBy: {
          name: "asc",
        },
      });
    },
    []
  );

  return NextResponse.json({ customers });
}

