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
  const user = await getCurrentPrismaUser();

  if (!user) {
    redirect(`/${defaultLocale}/auth/sign-in`);
  }

  if (user.role === "ADMIN" || user.role === "BARBER") {
    redirect("/admin");
  }

  const locale = await getLocale();
  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <HeaderClient />
      <main className="flex-1">{children}</main>
      <Footer />
    </NextIntlClientProvider>
  );
}
