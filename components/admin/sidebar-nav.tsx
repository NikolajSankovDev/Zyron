"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
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

export function SidebarNav() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("admin");

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
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

