import { redirect } from "next/navigation";
import { safePrismaQuery, prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations, getLocale } from "next-intl/server";
import { defaultLocale } from "@/lib/i18n/config-constants";
import { getCurrentPrismaUser } from "@/lib/clerk-user-sync";
import { format } from "date-fns";
import { Calendar, Clock, User, Scissors } from "lucide-react";
import PhoneSyncChecker from "@/components/account/phone-sync-checker";

// Helper function to get status badge styling
function getStatusBadgeStyle(status: string) {
  switch (status) {
    case "BOOKED":
      return "bg-primary/20 text-primary border-primary/30";
    case "COMPLETED":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "CANCELED":
      return "bg-gray-700/50 text-gray-400 border-gray-600/30";
    case "ARRIVED":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "MISSED":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default:
      return "bg-gray-700/50 text-gray-300 border-gray-600/30";
  }
}

// Helper function to format duration - will be called with translations
function formatDuration(minutes: number, t: any) {
  if (minutes < 60) {
    return `${minutes} ${t("minutes")}`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} ${hours > 1 ? t("hours") : t("hour")}`;
  }
  return `${hours} ${hours > 1 ? t("hours") : t("hour")} ${mins} ${mins > 1 ? t("minutes") : t("minute")}`;
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Await searchParams to prevent serialization errors
  await searchParams;
  
  const t = await getTranslations("account");
  const tAuth = await getTranslations("auth");
  const locale = await getLocale();

  // Get current user from Prisma (synced from Clerk)
  const user = await getCurrentPrismaUser();

  if (!user) {
    redirect(`/${defaultLocale}/auth/sign-in`);
  }

  // Get upcoming appointments
  const upcomingAppointments = await safePrismaQuery(
    async () => {
      if (!prisma) return [];
      if (!user) return [];
      return await prisma.appointment.findMany({
        where: {
          customerId: user.id,
          startTime: {
            gte: new Date(),
          },
        },
        include: {
          barber: {
            include: {
              user: true,
            },
          },
          appointmentServices: {
            include: {
              service: {
                include: {
                  translations: {
                    where: {
                      locale: locale as string,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          startTime: "asc",
        },
        take: 10,
      });
    },
    []
  );

  // Get past appointments
  const pastAppointments = await safePrismaQuery(
    async () => {
      if (!prisma) return [];
      if (!user) return [];
      return await prisma.appointment.findMany({
        where: {
          customerId: user.id,
          startTime: {
            lt: new Date(),
          },
        },
        include: {
          barber: {
            include: {
              user: true,
            },
          },
          appointmentServices: {
            include: {
              service: {
                include: {
                  translations: {
                    where: {
                      locale: locale as string,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          startTime: "desc",
        },
        take: 10,
      });
    },
    []
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Phone Sync Checker - automatically syncs phone if missing */}
      <PhoneSyncChecker currentPhone={user?.phone || null} />
      
      {/* Header Section */}
      <section className="bg-black pt-24 sm:pt-28 lg:pt-32">
        <div className="container-fluid">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-hero font-bold mb-2 text-white">
              {t("welcomeUser", { name: user?.name || "User" })}
            </h1>
            <p className="text-body text-gray-400">
              {t("loggedInAs", { email: user?.email || "" })}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-section">
        <div className="container-fluid">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* User Details Card */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">{t("userDetails")}</CardTitle>
                <a
                  href="/account/profile"
                  className="text-primary hover:text-primary/80 text-small font-medium transition-colors"
                >
                  {t("myProfile")} →
                </a>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-small text-gray-400 mb-1">{tAuth("name")}</p>
                  <p className="text-body text-white">{user?.name || t("notAvailable")}</p>
                </div>
                <div>
                  <p className="text-small text-gray-400 mb-1">{tAuth("email")}</p>
                  <p className="text-body text-white">{user?.email || t("notAvailable")}</p>
                </div>
                <div>
                  <p className="text-small text-gray-400 mb-1">{tAuth("phone")}</p>
                  <p className="text-body text-white">
                    {(user?.phone && user.phone.trim().length > 0) ? user.phone : t("notAvailable")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Appointments Card */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">{t("upcomingAppointments")}</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length === 0 ? (
                  <p className="text-body text-gray-400">{t("noUpcomingAppointments")}</p>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.map((apt: any) => {
                      const startDate = new Date(apt.startTime);
                      const endDate = new Date(apt.endTime);
                      const totalDuration = apt.appointmentServices?.reduce(
                        (sum: number, as: any) => sum + (as.service?.durationMinutes || 0),
                        0
                      ) || 0;
                      const services = apt.appointmentServices?.map((as: any) => {
                        const translation = as.service?.translations?.[0];
                        return translation?.name || as.service?.slug || "Service";
                      }) || [];

                      return (
                        <div
                          key={apt.id}
                          className="p-5 border border-gray-800 rounded-lg bg-black/50 hover:border-gray-700 transition-colors"
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start gap-3">
                                  <Calendar className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-body font-semibold text-white">
                                      {format(startDate, "EEEE, MMMM d, yyyy")}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Clock className="h-4 w-4 text-gray-400" />
                                      <p className="text-small text-gray-400">
                                        {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <User className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                  <p className="text-body text-gray-300">
                                    {apt.barber?.displayName || t("barber")}
                                  </p>
                                </div>
                                {services.length > 0 && (
                                  <div className="flex items-start gap-3">
                                    <Scissors className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-small text-gray-400 mb-1">{t("services")}</p>
                                      <p className="text-body text-gray-300">
                                        {services.join(", ")}
                                      </p>
                                      {totalDuration > 0 && (
                                        <p className="text-small text-gray-500 mt-1">
                                          {t("duration")}: {formatDuration(totalDuration, t)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-3 sm:items-start">
                                <span
                                  className={`text-small px-3 py-1.5 rounded-full border font-medium ${getStatusBadgeStyle(apt.status)}`}
                                >
                                  {apt.status}
                                </span>
                                <p className="text-body text-primary font-bold">
                                  €{Number(apt.totalPrice).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past Appointments Card */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">{t("pastAppointments")}</CardTitle>
              </CardHeader>
              <CardContent>
                {pastAppointments.length === 0 ? (
                  <p className="text-body text-gray-400">{t("noPastAppointments")}</p>
                ) : (
                  <div className="space-y-4">
                    {pastAppointments.map((apt: any) => {
                      const startDate = new Date(apt.startTime);
                      const endDate = new Date(apt.endTime);
                      const totalDuration = apt.appointmentServices?.reduce(
                        (sum: number, as: any) => sum + (as.service?.durationMinutes || 0),
                        0
                      ) || 0;
                      const services = apt.appointmentServices?.map((as: any) => {
                        const translation = as.service?.translations?.[0];
                        return translation?.name || as.service?.slug || "Service";
                      }) || [];

                      return (
                        <div
                          key={apt.id}
                          className="p-5 border border-gray-800 rounded-lg bg-black/50 hover:border-gray-700 transition-colors"
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start gap-3">
                                  <Calendar className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-body font-semibold text-white">
                                      {format(startDate, "EEEE, MMMM d, yyyy")}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Clock className="h-4 w-4 text-gray-500" />
                                      <p className="text-small text-gray-400">
                                        {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <User className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                                  <p className="text-body text-gray-300">
                                    {apt.barber?.displayName || t("barber")}
                                  </p>
                                </div>
                                {services.length > 0 && (
                                  <div className="flex items-start gap-3">
                                    <Scissors className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-small text-gray-400 mb-1">Services</p>
                                      <p className="text-body text-gray-300">
                                        {services.join(", ")}
                                      </p>
                                      {totalDuration > 0 && (
                                        <p className="text-small text-gray-500 mt-1">
                                          Duration: {formatDuration(totalDuration)}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-3 sm:items-start">
                                <span
                                  className={`text-small px-3 py-1.5 rounded-full border font-medium ${getStatusBadgeStyle(apt.status)}`}
                                >
                                  {apt.status}
                                </span>
                                <p className="text-body text-primary font-bold">
                                  €{Number(apt.totalPrice).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
