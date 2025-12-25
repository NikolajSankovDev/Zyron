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

  // #region agent log
  // Note: This is a server component, so we can't use fetch here
  // #endregion

  return (
    <>
      <DashboardScrollFix />
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 lg:h-full flex flex-col lg:overflow-y-auto overflow-visible min-h-0" data-admin-page="services">
        <ServicesListClient services={services} />
      </div>
    </>
  );
}
