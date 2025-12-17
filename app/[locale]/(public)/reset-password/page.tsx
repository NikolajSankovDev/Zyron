"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignIn, useAuth, useClerk } from "@clerk/nextjs";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { logger } from "@/lib/logger";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const { signIn, isLoaded } = useSignIn();
  const { isSignedIn, sessionId } = useAuth();
  const clerk = useClerk();

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<"code" | "password">("code");

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn) {
      router.push(`/${locale}`);
    }
  }, [isSignedIn, router, locale]);

  // Check signIn status to determine current step
  useEffect(() => {
    if (isLoaded && signIn) {
      if (signIn.status === "needs_new_password") {
        setStep("password");
      } else if (signIn.status === "needs_first_factor") {
        setStep("code");
      } else if (signIn.status !== "needs_first_factor" && signIn.status !== "needs_new_password") {
        // No active password reset session, redirect to forgot password
        router.push(`/${locale}/forgot-password`);
      }
    }
  }, [signIn, isLoaded, router, locale]);

  async function handleCodeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!isLoaded || !signIn) {
      setLoading(false);
      setError("System not ready. Please try again.");
      return;
    }

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
      });

      if (result.status === "needs_new_password") {
        setStep("password");
      } else {
        setError("Invalid code. Please try again.");
      }
    } catch (err: any) {
      logger.error("Password reset code verification error", err as Error);
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0].message || "Invalid code. Please try again.");
      } else {
        setError("Invalid code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("passwordMinLength"));
      return;
    }

    setLoading(true);

    if (!isLoaded || !signIn) {
      setLoading(false);
      setError("System not ready. Please try again.");
      return;
    }

    try {
      const result = await signIn.resetPassword({
        password: password,
      });

      if (result.status === "complete") {
        logger.info("Password reset successful");
        // Don't set active session - user needs to log in with new password
        // Destroy the signIn state and sign out to prevent session restoration
        try {
          // Destroy the signIn session to prevent it from being restored
          await signIn.destroy();
        } catch (destroyErr) {
          // Ignore destroy errors
        }
        
        // Also sign out any active session
        try {
          await clerk.signOut();
        } catch (signOutErr) {
          // Ignore sign out errors
        }
        
        setSuccess(true);
        // Use window.location for hard redirect to ensure clean state
        setTimeout(() => {
          window.location.href = `/${locale}/auth/sign-in`;
        }, 2000);
      } else {
        setError("An error occurred. Please try again.");
      }
    } catch (err: any) {
      logger.error("Password reset error", err as Error);
      if (err.errors && err.errors.length > 0) {
        setError(err.errors[0].message || t("errorOccurred"));
      } else {
        setError(t("errorOccurred"));
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-black flex flex-col">
        <section className="min-h-[calc(100vh-200px)] flex items-center justify-center pt-24 sm:pt-28 lg:pt-32 pb-8 sm:pb-10 lg:pb-12">
          <div className="container-fluid">
            <div className="max-w-sm mx-auto">
              <div className="bg-gray-900 rounded-xl p-5 sm:p-6 border border-gray-800 shadow-xl">
                <div className="text-center mb-5 sm:mb-6">
                  <h1 className="text-section-title font-bold mb-2 text-white">
                    {t("passwordResetSuccessful")}
                  </h1>
                  <p className="text-body text-gray-300">
                    {t("passwordResetRedirect")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!isLoaded || !signIn) {
    return (
      <main className="min-h-screen bg-black flex flex-col">
        <section className="min-h-[calc(100vh-200px)] flex items-center justify-center pt-24 sm:pt-28 lg:pt-32 pb-8 sm:pb-10 lg:pb-12">
          <div className="container-fluid">
            <div className="max-w-sm mx-auto">
              <div className="bg-gray-900 rounded-xl p-5 sm:p-6 border border-gray-800 shadow-xl">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                  <p className="text-body text-gray-300">{t("loading")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black flex flex-col">
        <section className="min-h-[calc(100vh-200px)] flex items-center justify-center pt-24 sm:pt-28 lg:pt-32 pb-8 sm:pb-10 lg:pb-12">
          <div className="container-fluid">
            <div className="max-w-sm mx-auto">
              <div className="bg-gray-900 rounded-xl p-5 sm:p-6 border border-gray-800 shadow-xl">
                <div className="text-center mb-5 sm:mb-6">
                  <h1 className="text-section-title font-bold mb-2 text-white">
                    {t("resetPassword")}
                  </h1>
                  <p className="text-body text-gray-300">
                    {step === "code" 
                      ? t("enterCodeSentToEmail")
                      : t("enterNewPassword")
                    }
                  </p>
                </div>

                {step === "code" ? (
                  <form onSubmit={handleCodeSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-small">
                        {error}
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label htmlFor="code" className="text-white">
                        {t("verificationCode")}
                      </Label>
                      <Input
                        id="code"
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                        autoComplete="one-time-code"
                        className="h-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary text-small"
                        placeholder="Enter 6-digit code"
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
                          {t("loading")}
                        </>
                      ) : (
                        t("verifyCode")
                      )}
                    </Button>

                    <div className="pt-3">
                      <p className="text-small text-center text-gray-400">
                        <Link
                          href={`/${locale}/forgot-password`}
                          className="text-primary hover:text-primary/80 hover:underline transition-colors"
                        >
                          {tCommon("back")}
                        </Link>
                      </p>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-small">
                        {error}
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label htmlFor="password" className="text-white">
                        {t("newPassword")}
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
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

                    <div className="space-y-1">
                      <Label htmlFor="confirmPassword" className="text-white">
                        {t("confirmPassword")}
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                          className="h-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary text-small pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-10 text-small font-semibold"
                      disabled={loading || !isLoaded}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("resetting")}
                        </>
                      ) : (
                        t("resetPasswordButton")
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
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
  );
}
