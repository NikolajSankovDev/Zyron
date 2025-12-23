import { redirect } from "next/navigation";
import { safePrismaQuery, prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTranslations, getLocale } from "next-intl/server";
import { getCurrentPrismaUser } from "@/lib/clerk-user-sync";
import { DashboardScrollFix } from "@/components/admin/dashboard-scroll-fix";

export default async function ServicesPage() {
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

  return (
    <>
      <DashboardScrollFix />
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 lg:h-full flex flex-col lg:overflow-y-auto overflow-visible min-h-0" data-admin-page="services">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 flex-shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{t("services")}</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">{t("manageServiceOfferings")}</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto text-sm sm:text-base">{t("addService")}</Button>
      </div>

      <Card className="bg-gray-900 border-gray-800 flex flex-col lg:flex-1 lg:min-h-0">
        <CardHeader className="flex-shrink-0 px-3 sm:px-6">
          <CardTitle className="text-base sm:text-lg text-white">{t("allServices")}</CardTitle>
        </CardHeader>
        <CardContent className="lg:flex-1 lg:overflow-y-auto lg:min-h-0 px-3 sm:px-6 pb-8 lg:pb-6">
          {services.length === 0 ? (
            <p className="text-sm sm:text-base text-gray-400">
              {t("noServicesFound")} {!process.env.DATABASE_URL && "Database not connected."}
            </p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {services.map((service: any) => (
                <div
                  key={service.id}
                  className="p-3 sm:p-4 border border-gray-800 rounded-lg bg-black/50"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 sm:gap-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm sm:text-base">{service.slug}</p>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        {t("duration")}: {service.durationMinutes} min
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        {t("price")}: €{String(service.basePrice)}
                      </p>
                      <p className="text-xs sm:text-sm text-white mt-1">
                        {t("usedIn")}: {service._count?.appointmentServices || 0} {t("appointments")}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center flex-shrink-0 w-full sm:w-auto">
                      <span
                        className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                          service.active
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-gray-700 text-gray-400 border border-gray-600"
                        }`}
                      >
                        {service.active ? t("active") : t("inactive")}
                      </span>
                      <Button variant="outline" size="sm" className="border-gray-700 text-white hover:bg-gray-800 text-xs sm:text-sm">
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
    </>
  );
}
