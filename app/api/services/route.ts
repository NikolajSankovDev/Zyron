import { NextRequest, NextResponse } from "next/server";
import { safePrismaQuery, prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locale = searchParams.get("locale") || "de";

  const services = await safePrismaQuery(
    async () => {
      if (!prisma) return [];
      const allServices = await prisma.service.findMany({
        where: {
          active: true,
        },
        include: {
          translations: {
            where: {
              locale: locale,
            },
          },
        },
      });
      
      // Sort by order field if it exists, otherwise by id
      return allServices.sort((a, b) => {
        const orderA = (a as any).order ?? 0;
        const orderB = (b as any).order ?? 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.id - b.id;
      });
    },
    []
  );

  return NextResponse.json({ services });
}


