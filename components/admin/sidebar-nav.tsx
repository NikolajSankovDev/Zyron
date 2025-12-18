"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { locales, defaultLocale } from "@/lib/i18n/config-constants";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Settings,
} from "lucide-react";

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const baseNavItems: NavItem[] = [
  { href: "/admin", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/admin/calendar", labelKey: "calendar", icon: Calendar },
  { href: "/admin/customers", labelKey: "customers", icon: Users },
  { href: "/admin/barbers", labelKey: "barbers", icon: Scissors },
  { href: "/admin/services", labelKey: "services", icon: Settings },
];

const fallbackLabels: Record<string, string> = {
  dashboard: "Dashboard",
  calendar: "Calendar",
  customers: "Customers",
  barbers: "Barbers",
  services: "Services",
};

function deriveLocaleFromPath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const candidate = segments[0];
  if (candidate && locales.includes(candidate as (typeof locales)[number])) {
    return candidate;
  }
  return defaultLocale;
}

export function SidebarNav() {
  const pathname = usePathname();
  let locale = deriveLocaleFromPath(pathname);
  try {
    locale = useLocale();
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("SidebarNav: Falling back to derived locale", error);
    }
  }

  let translate = (key: string) => fallbackLabels[key] ?? key;
  try {
    translate = useTranslations("admin");
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("SidebarNav: Falling back to default labels", error);
    }
  }

  // Build nav items with locale prefix
  const navItems = baseNavItems.map(item => ({
    ...item,
    href: `/${locale}${item.href}`,
  }));

  return (
    <nav className="flex-1 space-y-1.5 px-4 py-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-gray-800 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {translate(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
