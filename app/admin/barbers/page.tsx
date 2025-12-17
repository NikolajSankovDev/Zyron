import { redirect } from "next/navigation";
import { safePrismaQuery, prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTranslations, getLocale } from "next-intl/server";
import { getCurrentPrismaUser } from "@/lib/clerk-user-sync";

export default async function BarbersPage() {
  const t = await getTranslations("admin");
  const tCommon = await getTranslations("common");
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">{t("barbers")}</h1>
          <p className="text-gray-400 mt-1">{t("manageBarberAccounts")}</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">{t("addBarber")}</Button>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">{t("allBarbers")}</CardTitle>
        </CardHeader>
        <CardContent>
          {barbers.length === 0 ? (
            <p className="text-gray-400">
              {t("noBarbersFound")} {!process.env.DATABASE_URL && "Database not connected."}
            </p>
          ) : (
            <div className="space-y-4">
              {barbers.map((barber: any) => (
                <div
                  key={barber.id}
                  className="p-4 border border-gray-800 rounded-lg bg-black/50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-white">{barber.displayName}</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {barber.user?.email || ""}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {t("languages")}: {barber.languages?.join(", ") || ""}
                      </p>
                      <p className="text-sm text-white mt-1">
                        {t("appointments")}: {barber._count?.appointments || 0}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          barber.active
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-gray-700 text-gray-400 border border-gray-600"
                        }`}
                      >
                        {barber.active ? t("active") : t("inactive")}
                      </span>
                      <Button variant="outline" size="sm" className="border-gray-700 text-white hover:bg-gray-800">
                        {tCommon("edit")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
