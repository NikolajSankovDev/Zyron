import { redirect } from "next/navigation";
import { MobileSidebar } from "@/components/admin/mobile-sidebar";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { AdminTopBar } from "@/components/admin/admin-top-bar";
import { getTranslations, getLocale } from "next-intl/server";
import { SidebarMiniCalendarWrapper } from "@/components/admin/sidebar-mini-calendar-wrapper";
import { getCurrentPrismaUser } from "@/lib/clerk-user-sync";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("admin");
  const tNav = await getTranslations("nav");
  
  // Get locale for building links and redirects
  const locale = await getLocale();

  // Get current user from Prisma (synced from Clerk)
  const user = await getCurrentPrismaUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  if (!["ADMIN", "BARBER"].includes(user.role)) {
    redirect(`/${locale}`);
  }

  const navItems = [
    { href: `/${locale}/admin`, label: "Dashboard" },
    { href: `/${locale}/admin/calendar`, label: "Calendar" },
    { href: `/${locale}/admin/customers`, label: "Customers" },
    { href: `/${locale}/admin/barbers`, label: "Barbers" },
    { href: `/${locale}/admin/services`, label: "Services" },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-80 lg:bg-gray-900 lg:border-r lg:border-gray-800">
        <div className="flex h-full flex-col">
          {/* Logo/Header */}
          <div className="flex h-16 items-center border-b border-gray-800 px-8">
            <h1 className="text-2xl font-bold text-white">{t("zyronAdmin")}</h1>
          </div>

          {/* Navigation */}
          <SidebarNav />

          {/* Mini Calendar - Only on calendar page */}
          <div className="flex-1 flex flex-col justify-end">
            <SidebarMiniCalendarWrapper />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-80 flex flex-col h-screen">
        {/* Top Bar */}
        <AdminTopBar
          navItems={navItems}
          user={user}
          logoutLabel={tNav("logout")}
        />

        {/* Page Content */}
        <main className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-4 sm:pb-6 lg:pb-8 flex-1 min-h-0 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
