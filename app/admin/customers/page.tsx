import { redirect } from "next/navigation";
import { safePrismaQuery, prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations, getLocale } from "next-intl/server";
import { getCurrentPrismaUser } from "@/lib/clerk-user-sync";

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

      <Card className="bg-gray-900 border-gray-800 flex flex-col flex-1 min-h-0">
        <CardHeader className="flex-shrink-0 px-3 sm:px-6">
          <CardTitle className="text-base sm:text-lg text-white">{t("allCustomers")}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-6">
          {customers.length === 0 ? (
            <p className="text-sm sm:text-base text-gray-400">
              {t("noCustomersFound")} {!process.env.DATABASE_URL && "Database not connected."}
            </p>
          ) : (
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-semibold text-gray-400">{t("name")}</th>
                    <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-semibold text-gray-400">{t("email")}</th>
                    <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-semibold text-gray-400">{t("phone")}</th>
                    <th className="text-left p-2 sm:p-4 text-xs sm:text-sm font-semibold text-gray-400">{t("appointments")}</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer: any) => (
                    <tr
                      key={customer.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="p-2 sm:p-4 text-white text-xs sm:text-sm">{customer.name}</td>
                      <td className="p-2 sm:p-4">
                        <a
                          href={`mailto:${customer.email}`}
                          className="text-primary hover:underline text-xs sm:text-sm break-all"
                        >
                          {customer.email}
                        </a>
                      </td>
                      <td className="p-2 sm:p-4">
                        {customer.phone ? (
                          <a
                            href={`tel:${customer.phone}`}
                            className="text-primary hover:underline text-xs sm:text-sm"
                          >
                            {customer.phone}
                          </a>
                        ) : (
                          <span className="text-gray-500 text-xs sm:text-sm">-</span>
                        )}
                      </td>
                      <td className="p-2 sm:p-4 text-white text-xs sm:text-sm">
                        {customer._count?.customerAppointments || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
