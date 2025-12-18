import { notFound } from "next/navigation";
import { locales } from "@/lib/i18n/config-constants";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Note: searchParams is not available in layout components

  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  return (
    <>
      {children}
    </>
  );
}
