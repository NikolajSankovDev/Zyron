import { redirect } from "next/navigation";
import { safePrismaQuery, prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Scissors, Clock } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { getCurrentPrismaUser } from "@/lib/clerk-user-sync";

export default async function AdminDashboardPage() {
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

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Fetch statistics
  const [
    todaysAppointments,
    totalCustomers,
    totalBarbers,
    upcomingAppointments,
  ] = await Promise.all([
    // Today's appointments
    safePrismaQuery(
      async () => {
        if (!prisma) return 0;
        const count = await prisma.appointment.count({
          where: {
            startTime: {
              gte: today,
              lt: tomorrow,
            },
            status: {
              not: "CANCELED",
            },
          },
        });
        return count;
      },
      0
    ),
    // Total customers
    safePrismaQuery(
      async () => {
        if (!prisma) return 0;
        return await prisma.user.count({
          where: {
            role: "CUSTOMER",
          },
        });
      },
      0
    ),
    // Total barbers
    safePrismaQuery(
      async () => {
        if (!prisma) return 0;
        return await prisma.barber.count({
          where: {
            active: true,
          },
        });
      },
      0
    ),
    // Upcoming appointments
    safePrismaQuery(
      async () => {
        if (!prisma) return 0;
        return await prisma.appointment.count({
          where: {
            startTime: {
              gte: new Date(),
            },
            status: {
              not: "CANCELED",
            },
          },
        });
      },
      0
    ),
  ]);

  const stats = [
    {
      title: t("todaysAppointments"),
      value: todaysAppointments,
      icon: Calendar,
      description: t("appointmentsScheduledToday"),
    },
    {
      title: t("totalCustomers"),
      value: totalCustomers,
      icon: Users,
      description: t("registeredCustomers"),
    },
    {
      title: t("totalBarbers"),
      value: totalBarbers,
      icon: Scissors,
      description: t("activeBarbers"),
    },
    {
      title: t("upcomingAppointments"),
      value: upcomingAppointments,
      icon: Clock,
      description: t("futureAppointments"),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">{t("dashboard")}</h1>
        <p className="text-gray-400 mt-1">{t("welcomeBack", { name: user.name })}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity Placeholder */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">{t("recentActivity")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">{t("recentActivityPlaceholder")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

