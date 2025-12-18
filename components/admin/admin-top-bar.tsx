"use client";

import { Button } from "@/components/ui/button";
import { MobileSidebar } from "./mobile-sidebar";
import { LogOut } from "lucide-react";
import LanguageSwitcher from "@/components/layout/language-switcher";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

interface NavItem {
  href: string;
  label: string;
}

interface AdminTopBarProps {
  navItems: NavItem[];
  user: { name?: string | null; email?: string | null };
  logoutLabel: string;
}

export function AdminTopBar({ navItems, user, logoutLabel }: AdminTopBarProps) {
  const { signOut } = useClerk();
  const router = useRouter();
  const locale = useLocale();

  async function handleSignOut() {
    try {
      await signOut();
      router.push(`/${locale}`);
    } catch (error) {
      console.error("Admin sign out failed:", error);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-800 bg-gray-900 px-4 sm:px-6 lg:px-6">
      <MobileSidebar navItems={navItems} user={user} />
      
      <div className="flex flex-1 items-center">
        {/* Spacer for mobile sidebar */}
      </div>

      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs text-gray-400">{user.email}</p>
        </div>
        <Button
          type="button"
          onClick={handleSignOut}
          variant="ghost"
          size="sm"
          className="text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{logoutLabel}</span>
        </Button>
      </div>
    </header>
  );
}
