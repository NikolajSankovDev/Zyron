import { getTranslations, getLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, Scissors, Sparkles, Users, Phone, Mail } from "lucide-react";
import { safePrismaQuery, prisma } from "@/lib/prisma";
import HeroSlideshow from "@/components/hero-slideshow";

// Hero slideshow images (first 3 gallery images)
const heroImages = [
  "/images/gallery/gallery-1.jpeg",
  "/images/gallery/gallery-2.jpeg",
  "/images/gallery/gallery-3.jpeg",
];

const barberImages: Record<string, string> = {
  "Daniyar": "https://cdn-nearcut.s3.amazonaws.com/RDTUXH/large_IMG_1683.jpg",
  "Valentyn": "https://cdn-nearcut.s3.amazonaws.com/TJUU82/large_f959831e-e2fd-46ac-a46d-9f393d65529e.jpeg",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Await searchParams to prevent serialization errors
  await searchParams;
  
  const locale = await getLocale();
  const t = await getTranslations("home");
  
  const getBarberBio = (displayName: string, defaultBio: string | null) => {
    const bioKey = `barber${displayName}Bio` as keyof typeof t;
    try {
      return t(bioKey as any) || defaultBio || "\u00A0";
    } catch {
      return defaultBio || "\u00A0";
    }
  };

  // Fetch active barbers
  const barbers = await safePrismaQuery(
    async () => {
      if (!prisma) return [];
      return await prisma.barber.findMany({
        where: {
          active: true,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          displayName: "asc",
        },
      });
    },
    []
  );

  return (
    <main className="min-h-screen bg-black pt-16 lg:pt-[72px]">
      {/* Hero Section - Full viewport on 14" MacBook Pro (1512×982) */}
      <section className="relative w-full min-h-[calc(100vh-64px)] lg:min-h-[calc(100vh-72px)] bg-black flex items-center pt-6 sm:pt-8 lg:pt-10 pb-section overflow-hidden">
        <div className="container-fluid">
          <div className="grid lg:grid-cols-[1.1fr_1.4fr] gap-8 sm:gap-10 lg:gap-12 xl:gap-14 items-center">
            {/* Left Column - Text Content */}
            <div className="text-center lg:text-left space-y-6 sm:space-y-7 lg:space-y-8 max-w-xs lg:max-w-sm mx-auto lg:mx-0 lg:ml-auto lg:mr-6 xl:mr-8 order-2 lg:order-1">
              <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                <h1 className="text-hero font-bold text-white leading-[1.1] whitespace-pre-line">
                  {t("heroTitle")}
                </h1>
                <p className="text-body-large text-gray-300 leading-relaxed">
                  {t("heroSubtitle")}
                </p>
              </div>
              
              <div className="flex flex-col items-center lg:items-start justify-center lg:justify-start pt-3 sm:pt-4">
                <Link href={`/${locale}/book`}>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-white font-medium sm:font-semibold px-5 sm:px-8 xl:px-10 py-2.5 sm:py-4 text-sm sm:text-base lg:text-lg rounded-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 h-10 sm:h-auto sm:min-h-[52px]"
                  >
                    {t("bookAppointment")}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column - Slideshow */}
            <div className="relative aspect-[4/3] w-full max-w-lg sm:max-w-xl lg:max-w-none mx-auto order-1 lg:order-2">
              <HeroSlideshow images={heroImages} interval={5000} />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-black pt-section pb-16 sm:pb-20 md:pb-section">
        <div className="container-fluid">
          <div className="text-center mb-6 sm:mb-7 lg:mb-8">
            <h2 className="text-section-title font-bold mb-2.5 sm:mb-3 text-white">
              {t("ourServices")}
            </h2>
            <p className="text-body text-gray-300 max-w-2xl mx-auto">
              {t("servicesDescription")}
            </p>
          </div>
          
          {/* Mobile: Kompaktes Listen-Layout */}
          <div className="sm:hidden space-y-3 max-w-sm mx-auto">
            <Link href={`/${locale}/book#services`} className="flex items-start gap-4 bg-gray-900/80 rounded-xl px-4 py-5 hover:bg-gray-800/80 transition-colors group">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/15 rounded-full flex-shrink-0">
                <Scissors className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="text-sm font-semibold text-white mb-1">
                  {t("haircut")}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {t("haircutDescription")}
                </p>
              </div>
              <span className="text-sm text-primary font-medium group-hover:translate-x-0.5 transition-transform pt-3">→</span>
            </Link>

            <Link href={`/${locale}/book#beard-services`} className="flex items-start gap-4 bg-gray-900/80 rounded-xl px-4 py-5 hover:bg-gray-800/80 transition-colors group">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/15 rounded-full flex-shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="text-sm font-semibold text-white mb-1">
                  {t("beardService")}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {t("beardServiceDescription")}
                </p>
              </div>
              <span className="text-sm text-primary font-medium group-hover:translate-x-0.5 transition-transform pt-3">→</span>
            </Link>

            <Link href={`/${locale}/book#head-wash-massage-styling`} className="flex items-start gap-4 bg-gray-900/80 rounded-xl px-4 py-5 hover:bg-gray-800/80 transition-colors group">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/15 rounded-full flex-shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="text-sm font-semibold text-white mb-1">
                  {t("premiumService")}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {t("premiumServiceDescription")}
                </p>
              </div>
              <span className="text-sm text-primary font-medium group-hover:translate-x-0.5 transition-transform pt-3">→</span>
            </Link>
          </div>

          {/* Tablet/Desktop: Card-Grid Layout */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-5 xl:gap-6 max-w-5xl mx-auto">
            <div className="bg-gray-900 rounded-xl p-4 sm:p-5 lg:p-5 hover:border-primary border-2 border-transparent transition-all flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-10 h-10 lg:w-11 lg:h-11 bg-primary/20 rounded-full mb-3 lg:mb-3.5">
                <Scissors className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
              </div>
              <h3 className="text-card-title font-bold mb-1.5 lg:mb-2 text-white">
                {t("haircut")}
              </h3>
              <p className="text-small text-gray-300 mb-4 lg:mb-4.5 flex-grow leading-relaxed">
                {t("haircutDescription")}
              </p>
              <Link href={`/${locale}/book#services`} className="mt-auto">
                <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-5 py-2 text-sm rounded-lg min-h-[42px]">
                  {t("bookNow")}
                </Button>
              </Link>
            </div>

            <div className="bg-gray-900 rounded-xl p-4 sm:p-5 lg:p-5 hover:border-primary border-2 border-transparent transition-all flex flex-col items-center text-center">
              <div className="flex items-center justify-center w-10 h-10 lg:w-11 lg:h-11 bg-primary/20 rounded-full mb-3 lg:mb-3.5">
                <Users className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
              </div>
              <h3 className="text-card-title font-bold mb-1.5 lg:mb-2 text-white">
                {t("beardService")}
              </h3>
              <p className="text-small text-gray-300 mb-4 lg:mb-4.5 flex-grow leading-relaxed">
                {t("beardServiceDescription")}
              </p>
              <Link href={`/${locale}/book#beard-services`} className="mt-auto">
                <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-5 py-2 text-sm rounded-lg min-h-[42px]">
                  {t("bookNow")}
                </Button>
              </Link>
            </div>

            <div className="bg-gray-900 rounded-xl p-4 sm:p-5 lg:p-5 hover:border-primary border-2 border-transparent transition-all flex flex-col items-center text-center sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-center w-10 h-10 lg:w-11 lg:h-11 bg-primary/20 rounded-full mb-3 lg:mb-3.5">
                <Sparkles className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
              </div>
              <h3 className="text-card-title font-bold mb-1.5 lg:mb-2 text-white">
                {t("premiumService")}
              </h3>
              <p className="text-small text-gray-300 mb-4 lg:mb-4.5 flex-grow leading-relaxed">
                {t("premiumServiceDescription")}
              </p>
              <Link href={`/${locale}/book#head-wash-massage-styling`} className="mt-auto">
                <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-5 py-2 text-sm rounded-lg min-h-[42px]">
                  {t("bookNow")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Barbers Section */}
      <section className="relative bg-black pt-12 sm:pt-16 md:pt-section pb-section overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/50 to-black"></div>
        
        <div className="container-fluid relative z-10">
          <div className="container-narrow">
            {/* Title */}
            <div className="text-center mb-8 sm:mb-10 lg:mb-12">
              <h2 className="text-section-title font-bold text-white">
                {t("ourBarbers")}
              </h2>
            </div>
            
            {/* Barber Cards - Centered */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-24 sm:gap-28 lg:gap-32 xl:gap-36">
              {barbers.slice(0, 2).map((barber, barberIndex) => {
                const barberImage = barberImages[barber.displayName] || null;
                
                const getLanguageName = (code: string) => {
                  const languageMap: Record<string, string> = {
                    de: t("languageDe"),
                    en: t("languageEn"),
                    ru: t("languageRu"),
                    uk: t("languageUk"),
                    bg: t("languageBg"),
                    tk: t("languageTk"),
                    uz: t("languageUz"),
                  };
                  return languageMap[code] || code;
                };
                
                return (
                  <div
                    key={barber.id}
                    className="flex flex-col items-center text-center"
                  >
                    {barberImage && (
                      <div className="relative w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 mb-4 rounded-full overflow-hidden ring-2 ring-gray-800/50 flex-shrink-0 shadow-lg">
                        <Image
                          src={barberImage}
                          alt={barber.displayName}
                          fill
                          className="object-cover"
                          style={{ objectPosition: "center 25%" }}
                        />
                      </div>
                    )}
                    <h3 className="text-card-title font-bold text-white mb-2">
                      {barber.displayName}
                    </h3>
                    <p className="text-body text-gray-300 mb-3 min-h-[2.5rem]">
                      {getBarberBio(barber.displayName, barber.bio)}
                    </p>
                    {barber.languages && barber.languages.length > 0 && (
                      <div className={`flex flex-wrap items-center justify-center gap-1 mt-auto ${barberIndex === 0 ? 'max-w-[200px] sm:max-w-none' : ''}`}>
                        {barber.languages.map((lang, index) => (
                          <span key={lang} className="text-small text-gray-400">
                            {getLanguageName(lang)}
                            {index < barber.languages.length - 1 && <span className="mx-1 text-gray-600">•</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-black py-section">
        <div className="container-fluid">
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <h2 className="text-section-title font-bold text-white">
              {t("location")}
            </h2>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-6 sm:gap-8 lg:gap-12 items-center max-w-5xl mx-auto">
            {/* Contact Info */}
            <div className="space-y-8 lg:pr-4">
              {/* Address & Contact Combined */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-11 h-11 bg-primary/20 rounded-full flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-card-title font-bold text-white">
                    {t("address")}
                  </h3>
                </div>
                <div className="space-y-1.5 pl-[56px]">
                  <p className="text-body text-gray-300">Konstanzer Str. 58</p>
                  <p className="text-body text-gray-300">10707 Berlin</p>
                  <a 
                    href="tel:+491621614426" 
                    className="block text-body text-gray-300 hover:text-primary transition-colors mt-3"
                  >
                    +49 162 161 4426
                  </a>
                  <a 
                    href="mailto:info@zyronstudio.de" 
                    className="block text-body text-gray-300 hover:text-primary transition-colors"
                  >
                    info@zyronstudio.de
                  </a>
                </div>
              </div>

              {/* Opening Hours */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-11 h-11 bg-primary/20 rounded-full flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-card-title font-bold text-white">
                    {t("openingHours")}
                  </h3>
                </div>
                <div className="space-y-2 pl-[56px]">
                  <div>
                    <p className="text-body font-semibold text-white">{t("mondaySaturday")}</p>
                    <p className="text-body text-gray-300">10:00 - 14:30</p>
                    <p className="text-body text-gray-300">15:00 - 20:00</p>
                  </div>
                  <div>
                    <p className="text-body font-semibold text-white">{t("sundayClosed")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Maps */}
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border-2 border-gray-800 shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2427.5!2d13.3117856!3d52.4971329!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47a8513dfd16bb15%3A0x7972b7a2b9ab3b31!2sZyron%20barber%20studio%20%7C%20Kudamm!5e0!3m2!1sde!2sde!4v1735654321000!5m2!1sde!2sde"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Zyron Barber Studio Location - Konstanzer Str. 58, 10707 Berlin"
              ></iframe>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
