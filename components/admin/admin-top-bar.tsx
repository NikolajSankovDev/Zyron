"use client";

import { Button } from "@/components/ui/button";
import { MobileSidebar } from "./mobile-sidebar";
import { LogOut } from "lucide-react";
import LanguageSwitcher from "@/components/layout/language-switcher";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect } from "react";

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

  useEffect(() => {
    const fixMainContentMargin = () => {
      const mainWrapper = document.querySelector('[data-main-content-wrapper]') as HTMLElement;
      const sidebar = document.querySelector('aside[class*="lg:fixed"]') as HTMLElement;
      
      if (mainWrapper) {
        const isMobile = window.innerWidth < 1024;
        
        if (isMobile) {
          mainWrapper.style.setProperty('margin-left', '0', 'important');
          mainWrapper.style.setProperty('width', '100%', 'important');
          mainWrapper.style.setProperty('max-width', '100%', 'important');
        } else {
          // Desktop: set margin to account for sidebar (w-80 = 20rem = 320px)
          // But first check actual sidebar width
          const actualSidebarWidth = sidebar?.offsetWidth || 320;
          const marginValue = `${actualSidebarWidth}px`;
          mainWrapper.style.setProperty('margin-left', marginValue, 'important');
          mainWrapper.style.removeProperty('width');
          mainWrapper.style.removeProperty('max-width');
        }
        
        // Force reflow
        void mainWrapper.offsetHeight;
      }
    };
    
    // Apply fix with delays to handle dynamic content
    fixMainContentMargin();
    setTimeout(fixMainContentMargin, 100);
    setTimeout(fixMainContentMargin, 500);
    setTimeout(fixMainContentMargin, 1000);
    
    // Also fix on resize
    window.addEventListener('resize', fixMainContentMargin);
    
    return () => {
      window.removeEventListener('resize', fixMainContentMargin);
    };
  }, []);

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
