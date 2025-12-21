import { getSession } from "@/lib/auth/get-session";
import { redirect } from "next/navigation";
import { MobileSidebar } from "@/components/admin/mobile-sidebar";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { AdminTopBar } from "@/components/admin/admin-top-bar";
import { getTranslations, getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { SidebarMiniCalendarWrapper } from "@/components/admin/sidebar-mini-calendar-wrapper";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const t = await getTranslations("admin");
  const tNav = await getTranslations("nav");
  
  // Get locale and messages for NextIntlClientProvider
  const locale = await getLocale();
  const messages = await getMessages();

  if (!session?.user || !["ADMIN", "BARBER"].includes(session.user.role)) {
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
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="h-screen flex flex-col bg-black">
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
      <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: '20rem' }} data-main-content-wrapper>
        {/* Top Bar */}
        <AdminTopBar
          navItems={navItems}
          user={session.user}
          logoutLabel={tNav("logout")}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-hidden admin-calendar-main" style={{ padding: 0, margin: 0 }} data-admin-main>{children}</main>
      </div>
    </div>
    </NextIntlClientProvider>
  );
}

