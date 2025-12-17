import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { defaultLocale } from "@/lib/i18n/config-constants";
import HeaderClient from "@/components/layout/header-client";
import Footer from "@/components/layout/footer";
import { getCurrentPrismaUser } from "@/lib/clerk-user-sync";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // Get current user from Prisma (synced from Clerk)
    const user = await getCurrentPrismaUser();

    // Redirect to login if not authenticated
    if (!user) {
      redirect(`/${defaultLocale}/auth/sign-in`);
    }

    // Redirect admin/barber to admin panel
    if (user.role === "ADMIN" || user.role === "BARBER") {
      redirect("/admin");
    }

    // Get locale from request (falls back to defaultLocale for /account routes)
    const locale = await getLocale();

    // Get messages for the locale
    const messages = await getMessages({ locale });

    return (
      <NextIntlClientProvider messages={messages} locale={locale}>
        <HeaderClient />
        <main className="flex-1">{children}</main>
        <Footer />
      </NextIntlClientProvider>
    );
  } catch (error) {
    console.error("Error in AccountLayout:", error);
    // Log full error details
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    // Redirect to sign-in on error
    redirect(`/${defaultLocale}/auth/sign-in`);
  }
}
