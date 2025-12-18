"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, useSignUp } from "@clerk/nextjs";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { logger } from "@/lib/logger";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
// Phone persistence handled via API routes after session is active

export default function SignUpPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
  const { isSignedIn } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Persist phone via authenticated API and fallback sync
  const persistPhone = async (phone: string) => {
    const payload = { phone: phone.trim() };
    try {
      const res = await fetch("/api/user/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        logger.info(`[signup] Phone saved via /api/user/phone: ${data.phone || payload.phone}`);
        return true;
      }

      const err = await res.json().catch(() => ({}));
      logger.warn(`[signup] /api/user/phone failed: ${err.error || res.status}`);
    } catch (err) {
      logger.error("[signup] Error calling /api/user/phone", err as Error);
    }

    // Fallback: trigger sync-phone to pull from Clerk if metadata already set elsewhere
    try {
      const res = await fetch("/api/user/sync-phone", { method: "POST" });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        logger.info(`[signup] Fallback /api/user/sync-phone success: ${data.phone || "unknown"}`);
        return true;
      }
      if (res.status === 401) {
        logger.warn("[signup] /api/user/sync-phone unauthorized (session not ready yet)");
      }
    } catch (err) {
      logger.error("[signup] Error calling /api/user/sync-phone", err as Error);
    }

    return false;
  };

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

    if (!isLoaded || !signUp) {
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (!formData.phone.trim()) {
      setError("Phone number is required");
      setLoading(false);
      return;
    }

    try {
      // Create user in Clerk (without phoneNumber since it may not be enabled)
      const result = await signUp.create({
        emailAddress: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        // Note: phoneNumber is not passed here because phone authentication
        // may not be enabled in Clerk dashboard. We'll store it in Prisma instead.
      });

      if (result.status === "missing_requirements") {
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setVerificationStep(true);
      } else if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        
        logger.info("User registration successful");
        
        // Store phone number before navigating away so persistence can't be cancelled
        if (formData.phone.trim()) {
          await persistPhone(formData.phone);
        }
        
        // Redirect immediately after ensuring phone save attempt completed
        window.location.href = `/${locale}`;
        // Don't set loading to false here as we're redirecting
        return;
      }
    } catch (err: any) {
      logger.error("Registration error", err as Error);

      if (err.errors && err.errors.length > 0) {
        const errorCode = err.errors[0].code;
        switch (errorCode) {
          case "form_identifier_exists":
            setError("Email already exists");
            break;
          case "form_password_pwned":
            setError("Password has been found in a data breach. Please use a different, stronger password.");
            break;
          case "form_password_length_too_short":
            setError("Password must be at least 8 characters");
            break;
          default:
            setError(err.errors[0].message || "Registration failed");
        }
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerification(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!isLoaded || !signUp) {
      setLoading(false);
      return;
    }

    try {
      logger.info("Attempting email verification with code");
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      logger.info(`Verification result status: ${result.status}`);

      if (result.status === "complete") {
        logger.info("Verification complete, setting active session");
        await setActive({ session: result.createdSessionId });
        
        logger.info("User verification successful");
        
        // Store phone number before navigating away so persistence can't be cancelled
        if (formData.phone.trim()) {
          await persistPhone(formData.phone);
        }
        
        // Redirect immediately - don't wait for phone save now that it completed
        logger.info("Redirecting after successful verification");
        window.location.href = `/${locale}`;
        // Don't set loading to false here as we're redirecting
        return;
      } else {
        logger.warn(`Verification incomplete, status: ${result.status}`);
        setError("Verification incomplete. Please try again.");
        setLoading(false);
      }
    } catch (err: any) {
      logger.error("Verification error", err as Error);
      console.error("Full verification error:", err);
      if (
        err &&
        typeof err === "object" &&
        "errors" in err &&
        Array.isArray((err as any).errors) &&
        (err as any).errors.length > 0
      ) {
        setError(
          (err as any).errors[0].message || "Verification failed. Please try again."
        );
      } else {
        setError(err?.message || "Verification failed. Please try again.");
      }
      setLoading(false);
    }
  }

  if (verificationStep) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-black flex flex-col">
          <section className="min-h-[calc(100vh-200px)] flex items-center justify-center pt-24 sm:pt-28 lg:pt-32 pb-8 sm:pb-10 lg:pb-12">
          <div className="container-fluid">
            <div className="max-w-sm mx-auto space-y-4">
              <div className="bg-gray-900 rounded-xl p-5 sm:p-6 border border-gray-800 shadow-xl">
              <div className="text-center mb-6">
                <h1 className="text-section-title font-bold mb-1.5 text-white">
                  Verify Email
                </h1>
                  <p className="text-body text-gray-300">
                    Enter the verification code sent to your email
                  </p>
                </div>

                <form onSubmit={handleVerification} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-small">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="verification-code" className="text-white">
                      Verification Code
                    </Label>
                    <Input
                      id="verification-code"
                      type="text"
                      required
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength={6}
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
                        Verifying...
                      </>
                    ) : (
                      "Verify"
                    )}
                  </Button>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setVerificationStep(false)}
                      className="text-small text-gray-400 hover:text-white"
                    >
                      Back to sign up
                    </Button>
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

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black flex flex-col">
        <section className="min-h-[calc(100vh-200px)] flex items-center justify-center pt-24 sm:pt-28 lg:pt-32 pb-8 sm:pb-10 lg:pb-12">
        <div className="container-fluid">
          <div className="max-w-sm mx-auto space-y-4">
            <div className="bg-gray-900 rounded-xl p-5 sm:p-6 border border-gray-800 shadow-xl">
              <div className="text-center mb-6">
                <h1 className="text-section-title font-bold mb-1.5 text-white">
                  {t("register")}
                </h1>
                <p className="text-body text-gray-300">
                  Create your account
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-small">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-white">
                      {t("firstName")}
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="h-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary text-small"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-white">
                      {t("lastName")}
                    </Label>
                    <Input
                      id="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="h-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary text-small"
                    />
                  </div>
                </div>

                <div className="space-y-2">
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

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">
                    {t("phone")}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+49 123 456789"
                    className="h-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary text-small"
                  />
                </div>

                <div className="space-y-2">
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white">
                    {t("confirmPassword")}
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="h-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary text-small"
                  />
                </div>

                {/* Clerk CAPTCHA element - required for bot protection */}
                <div className="mt-5">
                  <div id="clerk-captcha" className="min-h-[78px] flex items-center justify-center" />
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 text-small font-semibold mt-6"
                  disabled={loading || !isLoaded}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("loading")}
                    </>
                  ) : (
                    t("register")
                  )}
                </Button>

                <div className="pt-3">
                  <p className="text-small text-center text-gray-400">
                    {t("alreadyHaveAccount")}{" "}
                    <Link
                      href={`/${locale}/auth/sign-in`}
                      className="text-primary hover:text-primary/80 hover:underline transition-colors"
                    >
                      {t("login")}
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
