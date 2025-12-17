import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTranslations } from "next-intl/server";
import { defaultLocale } from "@/lib/i18n/config-constants";
import { getCurrentPrismaUser } from "@/lib/clerk-user-sync";
import { updateProfile } from "@/lib/actions/user";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Await searchParams to prevent serialization errors
  await searchParams;
  
  const t = await getTranslations("account");
  const tAuth = await getTranslations("auth");

  // Get current user from Prisma (synced from Clerk)
  const user = await getCurrentPrismaUser();
  // #region agent log
  const profileLog = JSON.stringify({location:'account/profile/page.tsx:getCurrentPrismaUser',message:'Profile page got user',data:{hasUser:!!user,userId:user?.id,phone:user?.phone,email:user?.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'});
  await fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:profileLog}).catch(()=>{});
  // #endregion

  if (!user) {
    redirect(`/${defaultLocale}/auth/sign-in`);
  }

  return (
    <div className="min-h-screen bg-black">
      <section className="bg-black pt-section">
        <div className="container-fluid">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/account"
              className="inline-flex items-center gap-2 text-body text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Account
            </Link>
            <h1 className="text-hero font-bold mb-title text-white">{t("myProfile")}</h1>
          </div>
        </div>
      </section>

      <section className="py-section">
        <div className="container-fluid">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="p-5 md:p-6 border-b border-gray-800">
                <h2 className="text-card-title font-semibold text-white">{t("profileInformation")}</h2>
              </div>
              <div className="p-5 md:p-6">
                <form action={updateProfile} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-body font-semibold mb-2 text-white">
                      {tAuth("name")}
                    </label>
                    <Input id="name" name="name" defaultValue={user.name || ""} required className="h-12 bg-gray-800 border-gray-700 text-white" />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-body font-semibold mb-2 text-white">
                      {tAuth("email")}
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={user.email || ""}
                      disabled
                      className="h-12 bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-body font-semibold mb-2 text-white">
                      {tAuth("phone")}
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      defaultValue={user.phone || ""}
                      required
                      placeholder="+49 123 456789"
                      className="h-12 bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">{t("saveChanges")}</Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
