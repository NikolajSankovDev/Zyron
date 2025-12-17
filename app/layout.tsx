import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zyron Barber Studio",
  description: "Premium barber services in Berlin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html suppressHydrationWarning>
        <body suppressHydrationWarning>{children}</body>
      </html>
    </ClerkProvider>
  );
}
