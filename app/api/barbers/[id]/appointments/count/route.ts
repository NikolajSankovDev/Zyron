import { NextRequest, NextResponse } from "next/server";
import { safePrismaQuery, prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: barberId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate and endDate are required" },
      { status: 400 }
    );
  }

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const count = await safePrismaQuery(
      async () => {
        if (!prisma) return 0;
        const result = await prisma.appointment.count({
          where: {
            barberId,
            startTime: {
              gte: start,
              lte: end,
            },
            status: {
              not: "CANCELED",
            },
          },
        });
        return result;
      },
      0
    );

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error counting appointments:", error);
    return NextResponse.json(
      { error: "Failed to count appointments" },
      { status: 500 }
    );
  }
}

