import { redirect } from "next/navigation";
import { safePrismaQuery, prisma } from "@/lib/prisma";
import { getTranslations, getLocale } from "next-intl/server";
import { getCurrentPrismaUser } from "@/lib/clerk-user-sync";
import CustomersTable from "@/components/admin/customers-table";

export default async function CustomersPage() {
  const t = await getTranslations("admin");
  const locale = await getLocale();

  // Get current user from Prisma (synced from Clerk)
  const user = await getCurrentPrismaUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  if (!["ADMIN", "BARBER"].includes(user.role)) {
    redirect(`/${locale}`);
  }

  const customers = await safePrismaQuery(
    async () => {
      if (!prisma) return [];
      return await prisma.user.findMany({
        where: {
          role: "CUSTOMER",
        },
        include: {
          _count: {
            select: {
              customerAppointments: true,
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
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 h-full flex flex-col overflow-y-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{t("customers")}</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">{t("manageCustomerAccounts")}</p>
      </div>

      <CustomersTable customers={customers} />
    </div>
  );
}
