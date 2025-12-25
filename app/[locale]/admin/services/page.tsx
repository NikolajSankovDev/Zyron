import { redirect } from "next/navigation";
import { safePrismaQuery, prisma } from "@/lib/prisma";
import { getLocale } from "next-intl/server";
import { getCurrentPrismaUser } from "@/lib/clerk-user-sync";
import { DashboardScrollFix } from "@/components/admin/dashboard-scroll-fix";
import { ServicesListClient } from "@/components/admin/services-list-client";

export default async function ServicesPage() {
  const locale = await getLocale();

  // Get current user from Prisma (synced from Clerk)
  const user = await getCurrentPrismaUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  if (!["ADMIN", "BARBER"].includes(user.role)) {
    redirect(`/${locale}`);
  }

  const services = await safePrismaQuery(
    async () => {
      if (!prisma) return [];
      return await prisma.service.findMany({
        include: {
          translations: true,
          _count: {
            select: {
              appointmentServices: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    },
    []
  );

  // Convert Decimal to number for client component serialization
  const serializedServices = services.map((service) => ({
    ...service,
    basePrice: Number(service.basePrice),
  }));

  return (
    <>
      <DashboardScrollFix />
      <ServicesListClient services={serializedServices} />
    </>
  );
}
