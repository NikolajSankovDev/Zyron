"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUser, useAuth, useClerk } from "@clerk/nextjs";
import LanguageSwitcher from "./language-switcher";
import { useEffect, useState, useRef } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import { createPortal } from "react-dom";
import { useScrollbarFix } from "@/lib/hooks/use-scrollbar-fix";

export default function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { signOut } = useClerk();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const [userDropdownCoords, setUserDropdownCoords] = useState({ top: 0, left: 0, width: 0 });

  // Prevent scrollbar layout shift when dropdown opens
  useScrollbarFix(userDropdownOpen);

  useEffect(() => {
    if (!userLoaded || !authLoaded) return;

    if (isSignedIn && user) {
      const role = (user.publicMetadata?.role as string) || "CUSTOMER";
      setIsAuthenticated(true);
      setIsAdmin(["ADMIN", "BARBER"].includes(role));
      setUserName(
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`.trim()
          : user.firstName || user.lastName || null
      );
      setUserEmail(user.primaryEmailAddress?.emailAddress || null);
      return;
    }

    setIsAuthenticated(false);
    setIsAdmin(false);
    setUserName(null);
    setUserEmail(null);
  }, [user, userLoaded, authLoaded, isSignedIn]);

  // Update user dropdown coordinates when opening
  useEffect(() => {
    if (userDropdownOpen && userButtonRef.current) {
      const rect = userButtonRef.current.getBoundingClientRect();
      setUserDropdownCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [userDropdownOpen]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (userButtonRef.current && userButtonRef.current.contains(target)) {
        return;
      }
      const dropdown = document.getElementById("user-dropdown-portal");
      if (dropdown && dropdown.contains(target)) {
        return;
      }
      setUserDropdownOpen(false);
    }

    if (userDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", () => setUserDropdownOpen(false));
      window.addEventListener("resize", () => setUserDropdownOpen(false));
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", () => setUserDropdownOpen(false));
      window.removeEventListener("resize", () => setUserDropdownOpen(false));
    };
  }, [userDropdownOpen]);

  async function handleSignOut() {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUserName(null);
    setUserEmail(null);
    
    // Trigger storage event to notify other tabs/windows
    if (typeof window !== "undefined") {
      window.localStorage.setItem("auth-state", "logged-out");
      window.localStorage.removeItem("auth-state");
    }
    
    // Use Clerk's signOut
    await signOut();
    router.push(`/${locale}`);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-[999] bg-black">
      <div className="container-fluid">
        <div className="grid grid-cols-[auto_1fr_auto] items-center h-16 md:h-18 min-h-[64px] md:min-h-[72px] gap-2">
          {/* Left Side */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile: Language Switcher */}
            <div className="md:hidden">
              <LanguageSwitcher />
            </div>
            {/* Desktop: Logo */}
            <Link href={`/${locale}`} className="hidden md:flex items-center justify-center h-12 flex-shrink-0">
              <div className="relative h-10 w-auto max-w-[120px] flex items-center justify-center overflow-hidden">
                <img
                  src="/logo/logo.jpg"
                  alt="Zyron Barber Studio"
                  className="h-full w-full object-cover object-center"
                />
              </div>
            </Link>
          </div>

          {/* Mobile: Logo - Center (absolute) */}
          <Link href={`/${locale}`} className="md:hidden absolute left-1/2 -translate-x-1/2 flex items-center justify-center h-10">
            <div className="relative h-9 w-auto max-w-[90px] flex items-center justify-center overflow-hidden">
              <img
                src="/logo/logo.jpg"
                alt="Zyron Barber Studio"
                className="h-full w-full object-cover object-center"
              />
            </div>
          </Link>

          {/* Desktop: Navigation Links - Center */}
          <nav className="hidden lg:flex items-center justify-center gap-6 xl:gap-8 mx-auto">
            <Link
              href={`/${locale}`}
              className="text-body font-semibold text-white hover:text-primary transition-colors py-2"
            >
              {t("home")}
            </Link>
            <Link
              href={`/${locale}/gallery`}
              className="text-body font-semibold text-white hover:text-primary transition-colors py-2"
            >
              {t("gallery")}
            </Link>
            <Link
              href={`/${locale}/about`}
              className="text-body font-semibold text-white hover:text-primary transition-colors py-2"
            >
              {t("about")}
            </Link>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3 md:gap-4 justify-end min-w-0">
            {/* Desktop: Language Switcher and Auth */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0 min-w-0">
              <LanguageSwitcher />
              {isAuthenticated ? (
                <div className="relative flex-shrink-0">
                  <button
                    ref={userButtonRef}
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 h-9 px-3 rounded-md border border-gray-700 bg-transparent text-white hover:bg-primary hover:border-primary transition-colors whitespace-nowrap min-h-[36px]"
                    type="button"
                  >
                    <User className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline truncate max-w-[120px]">
                      {userName || userEmail || t("account")}
                    </span>
                    <span className="sm:hidden">{t("account")}</span>
                  </button>

                  {userDropdownOpen && typeof window !== 'undefined' && createPortal(
                    <div 
                      id="user-dropdown-portal"
                      className="fixed mt-1 w-56 overflow-hidden rounded-md border border-gray-800 bg-gray-900 text-white shadow-xl z-[9999]"
                      style={{
                        top: `${userDropdownCoords.top}px`,
                        left: `${userDropdownCoords.left}px`,
                      }}
                    >
                      <div className="p-1">
                        {/* User Info */}
                        <div className="px-3 py-2 border-b border-gray-800">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium text-white truncate">{userName || "User"}</p>
                            <p className="text-xs text-gray-400 truncate">{userEmail}</p>
                          </div>
                        </div>
                        
                        {/* Account Link */}
                        <Link
                          href="/account"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center w-full px-3 py-2 text-sm text-white hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                          <User className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span>{t("account")}</span>
                        </Link>
                        
                        {/* Admin Panel Link */}
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center w-full px-3 py-2 text-sm text-white hover:bg-gray-800 transition-colors cursor-pointer"
                          >
                            <svg className="mr-2 h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>Admin Panel</span>
                          </Link>
                        )}
                        
                        {/* Separator */}
                        <div className="h-px bg-gray-800 my-1" />
                        
                        {/* Logout */}
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            handleSignOut();
                          }}
                          className="flex items-center w-full px-3 py-2 text-sm text-white hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                          <LogOut className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span>{t("logout")}</span>
                        </button>
                      </div>
                    </div>,
                    document.body
                  )}
                </div>
              ) : (
                <Link href={`/${locale}/auth/sign-in`}>
                  <Button variant="outline" size="sm" className="whitespace-nowrap border-gray-700 text-white hover:bg-primary hover:border-primary min-h-[36px]">
                    {t("login")}
                  </Button>
                </Link>
              )}
              <Link href={`/${locale}/book`}>
                <Button 
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white font-semibold px-5 py-2 rounded-lg shadow-md hover:shadow-lg transition-all min-h-[36px]"
                >
                  {t("book")}
                </Button>
              </Link>
            </div>

            {/* Mobile/Tablet: Burger Menu - Right */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -mr-2 text-white min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div 
          className={`lg:hidden overflow-hidden transition-all duration-200 ease-out ${
            mobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="border-t border-gray-800/50 pt-2 pb-5 px-4">
            {/* Navigation Links */}
            <nav className="flex flex-col">
              <Link
                href={`/${locale}`}
                className="text-[15px] font-medium text-white/90 hover:text-primary transition-colors py-3 border-b border-gray-800/30"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("home")}
              </Link>
              <Link
                href={`/${locale}/gallery`}
                className="text-[15px] font-medium text-white/90 hover:text-primary transition-colors py-3 border-b border-gray-800/30"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("gallery")}
              </Link>
              <Link
                href={`/${locale}/about`}
                className="text-[15px] font-medium text-white/90 hover:text-primary transition-colors py-3 border-b border-gray-800/30"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t("about")}
              </Link>
              
            </nav>
            
            {/* Action Buttons - Stacked */}
            <div className="mt-5 flex flex-col gap-3 max-w-[280px] mx-auto">
              <Link
                href={`/${locale}/book`}
                onClick={() => setMobileMenuOpen(false)}
                className="block"
              >
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-11 rounded-lg text-[15px]"
                >
                  {t("book")}
                </Button>
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block"
                  >
                    <Button 
                      className="w-full bg-white/10 hover:bg-white/15 text-white font-medium h-11 rounded-lg text-[15px] border border-white/20"
                    >
                      {t("account")}
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link
                      href={`/${locale}/admin`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block"
                    >
                      <Button 
                        className="w-full bg-white/10 hover:bg-white/15 text-white font-medium h-11 rounded-lg text-[15px] border border-white/20"
                      >
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  href={`/${locale}/auth/sign-in`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block"
                >
                  <Button 
                    className="w-full bg-white/10 hover:bg-white/15 text-white font-medium h-11 rounded-lg text-[15px] border border-white/20"
                  >
                    {t("login")}
                  </Button>
                </Link>
              )}
            </div>
            
            {/* Logout - only if authenticated */}
            {isAuthenticated && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                  className="text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  {t("logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
