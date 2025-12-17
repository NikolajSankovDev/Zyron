"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, useSignUp, useUser, useClerk } from "@clerk/nextjs";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { logger } from "@/lib/logger";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { savePhoneAfterSignUp } from "@/lib/actions/user";

export default function SignUpPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
  const { isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const clerk = useClerk();

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
        
        // Store phone number in background - don't wait for it
        if (formData.phone.trim()) {
          const phoneNumber = formData.phone.trim();
          
          // #region agent log
          const signupCallLog = JSON.stringify({location:'app/[locale]/auth/sign-up/page.tsx:handleSubmit:savePhone',message:'Calling savePhoneAfterSignUp (non-blocking)',data:{phoneNumber:phoneNumber.substring(0,10)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,E'});
          fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:signupCallLog}).catch(()=>{});
          // #endregion
          
          // Fire and forget - don't wait for phone save
          savePhoneAfterSignUp(phoneNumber).then((result) => {
            // #region agent log
            const signupResultLog = JSON.stringify({location:'app/[locale]/auth/sign-up/page.tsx:handleSubmit:savePhoneResult',message:'savePhoneAfterSignUp result',data:{success:result.success,error:result.error||'none',details:result.details||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,E'});
            fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:signupResultLog}).catch(()=>{});
            // #endregion
            if (result.success) {
              logger.info(`✓ Successfully saved phone number during sign-up: ${result.details || ''}`);
            } else {
              logger.warn(`⚠ Failed to save phone during sign-up: ${result.error} - ${result.details || ''}`);
            }
          }).catch((error) => {
            logger.error("Error calling savePhoneAfterSignUp:", error);
          });
        }
        
        // Redirect immediately - don't wait for phone save
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
        
        // Store phone number in background - don't wait for it
        if (formData.phone.trim()) {
          const phoneNumber = formData.phone.trim();
          
          // #region agent log
          const verifyCallLog = JSON.stringify({location:'app/[locale]/auth/sign-up/page.tsx:handleVerification:savePhone',message:'Calling savePhoneAfterSignUp after verification (non-blocking)',data:{phoneNumber:phoneNumber.substring(0,10)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,E'});
          fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:verifyCallLog}).catch(()=>{});
          // #endregion
          
          // Fire and forget - don't wait for phone save
          savePhoneAfterSignUp(phoneNumber).then((result) => {
            // #region agent log
            const verifyResultLog = JSON.stringify({location:'app/[locale]/auth/sign-up/page.tsx:handleVerification:savePhoneResult',message:'savePhoneAfterSignUp result after verification',data:{success:result.success,error:result.error||'none',details:result.details||'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,E'});
            fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:verifyResultLog}).catch(()=>{});
            // #endregion
            if (result.success) {
              logger.info(`✓ Successfully saved phone number during verification: ${result.details || ''}`);
            } else {
              logger.warn(`⚠ Failed to save phone during verification: ${result.error} - ${result.details || ''}`);
            }
          }).catch((error) => {
            logger.error("Error calling savePhoneAfterSignUp:", error);
          });
        }
        
        // Redirect immediately - don't wait for phone save
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

