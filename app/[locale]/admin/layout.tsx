import { redirect } from "next/navigation";
import { MobileSidebar } from "@/components/admin/mobile-sidebar";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { AdminTopBar } from "@/components/admin/admin-top-bar";
import { getTranslations } from "next-intl/server";
import { SidebarMiniCalendarWrapper } from "@/components/admin/sidebar-mini-calendar-wrapper";
import { getCurrentPrismaUser } from "@/lib/clerk-user-sync";
import { ClerkContextCheck } from "@/components/admin/clerk-context-check";

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Note: searchParams is not available in layout components
  const t = await getTranslations("admin");
  const tNav = await getTranslations("nav");
  
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
    <div className="h-screen flex flex-col bg-black">
      <ClerkContextCheck />
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-72 lg:bg-gray-900 lg:border-r lg:border-gray-800">
        <div className="flex h-full flex-col">
          {/* Logo/Header - Aligned with top bar */}
          <div className="flex h-16 items-center border-b border-gray-800 px-6">
            <h1 className="text-xl font-bold text-white">{t("zyronAdmin")}</h1>
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
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-72" data-main-content-wrapper style={{ marginLeft: '18rem' }}>
        {/* Top Bar */}
        <AdminTopBar
          navItems={navItems}
          user={user}
          logoutLabel={tNav("logout")}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-hidden admin-calendar-main" style={{ padding: 0, margin: 0 }} data-admin-main>{children}</main>
      </div>
    </div>
  );
}
