"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSignIn } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { signIn, isLoaded } = useSignIn();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!isLoaded || !signIn) {
      setLoading(false);
      setError("System not ready. Please try again.");
      return;
    }

    try {
      // Initiate password reset using Clerk
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email.trim(),
      });

      // Redirect to reset password page to enter the code
      router.push(`/${locale}/reset-password`);
    } catch (err: any) {
      // Clerk doesn't reveal if email exists for security, so we always redirect
      // to prevent email enumeration - reset password page will handle invalid state
      router.push(`/${locale}/reset-password`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black flex flex-col">
        <section className="min-h-[calc(100vh-200px)] flex items-center justify-center pt-24 sm:pt-28 lg:pt-32 pb-8 sm:pb-10 lg:pb-12">
          <div className="container-fluid">
            <div className="max-w-sm mx-auto">
              <div className="bg-gray-900 rounded-xl p-5 sm:p-6 border border-gray-800 shadow-xl">
                {/* Header */}
                <div className="text-center mb-5 sm:mb-6">
                  <h1 className="text-section-title font-bold mb-2 text-white">
                    {t("forgotPassword")}
                  </h1>
                  <p className="text-body text-gray-300">
                    {t("enterEmailForReset")}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-small">
                      {error}
                    </div>
                  )}
                  
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-small font-semibold text-white">
                      {t("email")}
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="h-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary text-small"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-10 text-small font-semibold" 
                    disabled={loading || !isLoaded}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("sending")}
                      </>
                    ) : (
                      t("sendResetCode")
                    )}
                  </Button>
                  
                  <div className="pt-3">
                    <p className="text-small text-center text-gray-400">
                      <Link 
                        href={`/${locale}/auth/sign-in`} 
                        className="text-primary hover:text-primary/80 hover:underline transition-colors"
                      >
                        {tCommon("back")}
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
  );
}

