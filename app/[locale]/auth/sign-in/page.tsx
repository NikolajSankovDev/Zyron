"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, useSignIn } from "@clerk/nextjs";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { logger } from "@/lib/logger";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function SignInPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.push(`/${locale}`);
    }
  }, [isSignedIn, router, locale]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!isLoaded || !signIn) {
      setLoading(false);
      return;
    }

    try {
      const result = await signIn.create({
        identifier: formData.email.trim(),
        password: formData.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        logger.info("User login successful");

        // Get return URL from query params
        const searchParams = new URLSearchParams(window.location.search);
        const returnUrl = searchParams.get("redirect_url") || searchParams.get("returnUrl");
        
        if (returnUrl) {
          window.location.href = returnUrl;
        } else {
          router.push(`/${locale}`);
        }
      } else {
        setError("Additional verification required. Please check your email.");
      }
    } catch (err: any) {
      logger.error("Login error", err as Error);

      if (err.errors && err.errors.length > 0) {
        const errorCode = err.errors[0].code;
        switch (errorCode) {
          case "form_identifier_not_found":
            setError("Email not found");
            break;
          case "form_password_incorrect":
            setError("Incorrect password");
            break;
          case "too_many_requests":
            setError("Too many attempts. Please try again later.");
            break;
          default:
            setError(err.errors[0].message || "Login failed");
        }
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black flex flex-col">
        <section className="min-h-[calc(100vh-200px)] flex items-center justify-center pt-24 sm:pt-28 lg:pt-32 pb-8 sm:pb-10 lg:pb-12">
        <div className="container-fluid">
          <div className="max-w-sm mx-auto space-y-4">
            <div className="bg-gray-900 rounded-xl p-5 sm:p-6 border border-gray-800 shadow-xl">
              <div className="text-center mb-3">
                <h1 className="text-section-title font-bold mb-1.5 text-white">
                  {t("login")}
                </h1>
                <p className="text-body text-gray-300">
                  {t("enterCredentials")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-2.5">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-small">
                    {error}
                  </div>
                )}

                <div className="space-y-1">
                  <Label htmlFor="email" className="text-white">
                    {t("email")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="h-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary text-small"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-white">
                    {t("password")}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="h-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary text-small pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Link
                    href={`/${locale}/auth/forgot-password`}
                    className="text-small text-primary hover:text-primary/80 hover:underline transition-colors"
                  >
                    {t("forgotPassword")}
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 text-small font-semibold mt-4"
                  disabled={loading || !isLoaded}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("loading")}
                    </>
                  ) : (
                    t("login")
                  )}
                </Button>

                <div className="pt-1">
                  <p className="text-small text-center text-gray-400">
                    <Link
                      href={`/${locale}/auth/sign-up`}
                      className="text-primary hover:text-primary/80 hover:underline transition-colors"
                    >
                      {t("dontHaveAccount")} {t("register")}
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </>
  );
}

