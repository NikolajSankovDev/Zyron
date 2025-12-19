import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { getLocale } from "next-intl/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zyron Barber Studio",
  description: "Premium barber services in Berlin",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <ClerkProvider>
      <html lang={locale} suppressHydrationWarning>
        <body suppressHydrationWarning>{children}</body>
      </html>
    </ClerkProvider>
  );
}
