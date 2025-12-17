"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Settings,
  X,
  LogOut,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
}

interface MobileSidebarProps {
  navItems: NavItem[];
  user: { name?: string | null; email?: string | null };
}

export function MobileSidebar({ navItems, user }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("admin");
  const tNav = useTranslations("nav");
  const { signOut } = useClerk();

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="lg:hidden -ml-2 p-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md"
        aria-label="Toggle menu"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] lg:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <aside 
            className="fixed inset-y-0 left-0 z-[10001] w-72 max-w-[85vw] bg-gray-900 border-r border-gray-800 lg:hidden shadow-2xl transform transition-transform duration-300 ease-out"
            style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}
          >
            <div className="flex h-full flex-col overflow-hidden">
              {/* Header */}
              <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4 sm:px-6 flex-shrink-0 bg-gray-900">
                <h1 className="text-xl font-bold text-white">{t("zyronAdmin")}</h1>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md -mr-2 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation - Scrollable */}
              <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto min-h-0 overscroll-contain">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  // Map labels to icons
                  let Icon: React.ComponentType<{ className?: string }> | null = null;
                  if (item.label === "Dashboard") Icon = LayoutDashboard;
                  else if (item.label === "Calendar") Icon = Calendar;
                  else if (item.label === "Customers") Icon = Users;
                  else if (item.label === "Barbers") Icon = Scissors;
                  else if (item.label === "Services") Icon = Settings;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-gray-800 text-white"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      {Icon && <Icon className="h-5 w-5 flex-shrink-0" />}
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* User Section - Fixed at bottom */}
              <div className="border-t border-gray-800 p-4 flex-shrink-0 bg-gray-900">
                <div className="mb-3">
                  <p className="text-sm font-medium text-white truncate">{user.name || "User"}</p>
                  <p className="text-xs text-gray-400 truncate">{user.email || ""}</p>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  <LogOut className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span>{tNav("logout")}</span>
                </Button>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

