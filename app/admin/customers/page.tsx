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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">{t("customers")}</h1>
        <p className="text-gray-400 mt-1">{t("manageCustomerAccounts")}</p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">{t("allCustomers")}</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-gray-400">
              {t("noCustomersFound")} {!process.env.DATABASE_URL && "Database not connected."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">{t("name")}</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">{t("email")}</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">{t("phone")}</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-400">{t("appointments")}</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer: any) => (
                    <tr
                      key={customer.id}
                      className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="p-4 text-white">{customer.name}</td>
                      <td className="p-4">
                        <a
                          href={`mailto:${customer.email}`}
                          className="text-primary hover:underline text-sm"
                        >
                          {customer.email}
                        </a>
                      </td>
                      <td className="p-4">
                        {customer.phone ? (
                          <a
                            href={`tel:${customer.phone}`}
                            className="text-primary hover:underline text-sm"
                          >
                            {customer.phone}
                          </a>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </td>
                      <td className="p-4 text-white text-sm">
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
