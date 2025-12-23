import { redirect } from "next/navigation";
import { safePrismaQuery, prisma } from "@/lib/prisma";
import { getTranslations, getLocale } from "next-intl/server";
import { getCurrentPrismaUser } from "@/lib/clerk-user-sync";
import { DashboardScrollFix } from "@/components/admin/dashboard-scroll-fix";
import { BarbersListClient } from "@/components/admin/barbers-list-client";

export default async function BarbersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Await searchParams to prevent serialization errors
  await searchParams;
  
  const locale = await getLocale();

  // Get current user from Prisma (synced from Clerk)
  const user = await getCurrentPrismaUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  if (!["ADMIN", "BARBER"].includes(user.role)) {
    redirect(`/${locale}`);
  }

  const barbers = await safePrismaQuery(
    async () => {
      if (!prisma) return [];
      return await prisma.barber.findMany({
        include: {
          user: true,
          _count: {
            select: {
              appointments: true,
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

  return (
    <>
      <DashboardScrollFix />
      <BarbersListClient barbers={barbers} />
    </>
  );
}
