"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { register } from "@/lib/actions/auth";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tBooking = useTranslations("booking");
  const locale = useLocale();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // Client-side validation for password match
    if (password !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      setLoading(false);
      return;
    }

    const result = await register(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/account");
    }
  }

  return (
    <main className="min-h-screen bg-black flex flex-col">
      {/* Register Section - Centered */}
      <section className="min-h-screen flex items-center justify-center pt-24 sm:pt-28 lg:pt-32 pb-section">
        <div className="container-fluid w-full">
          <div className="max-w-sm mx-auto">
            {/* Register Card */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-xl">
              {/* Header */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2 text-white">
                  {t("register")}
                </h1>
                <p className="text-sm text-gray-300">
                  {t("createAccount")}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label htmlFor="name" className="block text-sm font-semibold text-white">
                    {t("name")}
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    className="h-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary text-sm"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-sm font-semibold text-white">
                    {t("email")}
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="h-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary text-sm"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="block text-sm font-semibold text-white">
                    {t("phone")}
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    className="h-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary text-sm"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-sm font-semibold text-white">
                    {t("password")}
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      minLength={6}
                      className="h-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                    >
                      {showPassword ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white">
                    {t("confirmPassword")}
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      minLength={6}
                      className="h-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      aria-label={showConfirmPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                    >
                      {showConfirmPassword ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-10 text-sm font-semibold mt-1" 
                  disabled={loading}
                >
                  {loading ? t("loading") : t("register")}
                </Button>
                
                <p className="text-sm text-center text-gray-300 pt-3">
                  {t("alreadyHaveAccount")}{" "}
                  <Link 
                    href={`/${locale}/login`} 
                    className="text-primary hover:text-primary/80 hover:underline transition-colors"
                  >
                    {t("login")}
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="relative bg-black py-section overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/50 to-black"></div>
        
        <div className="container-fluid relative z-10">
          <div className="container-narrow text-center">
            <h2 className="text-section-title font-bold mb-section text-white">
              {tBooking("connectWithUs")}
            </h2>
            
            {/* Icons */}
            <div className="flex justify-center items-center gap-8 md:gap-12 mb-8">
              {/* Phone */}
              <a
                href="tel:+491621614426"
                className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-primary/20 hover:bg-primary/30 border-2 border-primary/50 rounded-full text-primary transition-all hover:scale-110"
                aria-label="Telefon"
              >
                <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .684.949V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              </a>
              
              {/* Instagram */}
              <a
                href="http://instagram.com/Zyron.barberstudio"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-primary/20 hover:bg-primary/30 border-2 border-primary/50 rounded-full text-primary transition-all hover:scale-110"
                aria-label="Instagram"
              >
                <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              
              {/* WhatsApp */}
              <a
                href="https://wa.me/+491621614426"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-primary/20 hover:bg-primary/30 border-2 border-primary/50 rounded-full text-primary transition-all hover:scale-110"
                aria-label="WhatsApp"
              >
                <svg className="w-6 h-6 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </a>
            </div>
            
            {/* Address */}
            <p className="text-body text-gray-300">
              Konstanzer Str. 58, 10707 Berlin
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

