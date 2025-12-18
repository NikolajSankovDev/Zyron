"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";

export default function RegisterPage() {
  const locale = useLocale();
  const t = useTranslations("auth");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const returnUrl = searchParams.get("returnUrl");
    const redirectUrl = returnUrl
      ? `/${locale}/auth/sign-up?redirect_url=${encodeURIComponent(returnUrl)}`
      : `/${locale}/auth/sign-up`;

    window.location.replace(redirectUrl);
  }, [locale]);

  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-center space-y-2">
        <div className="text-lg font-semibold">{t("register")}</div>
        <div className="text-sm text-gray-300">{t("loading")}...</div>
      </div>
    </main>
  );
}
