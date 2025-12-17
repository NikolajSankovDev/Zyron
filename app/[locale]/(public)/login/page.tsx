"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

export default function LoginPage() {
  const locale = useLocale();

  // Redirect to Clerk sign-in page
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const returnUrl = searchParams.get("returnUrl");
      const redirectUrl = returnUrl 
        ? `/${locale}/auth/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`
        : `/${locale}/auth/sign-in`;
      
      window.location.replace(redirectUrl);
    }
  }, [locale]);

  // Show loading state while redirecting
  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Redirecting to sign in...</div>
    </main>
  );
}

