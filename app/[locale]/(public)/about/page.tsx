import { getTranslations, getLocale } from "next-intl/server";
import { safePrismaQuery } from "@/lib/prisma";
import { prisma } from "@/lib/prisma";
import { MapPin, Clock, Languages, Award, Users, Sparkles, Phone, Mail } from "lucide-react";
import Image from "next/image";

const barberImages: Record<string, string> = {
  "Daniyar": "https://cdn-nearcut.s3.amazonaws.com/RDTUXH/large_IMG_1683.jpg",
  "Valentyn": "https://cdn-nearcut.s3.amazonaws.com/TJUU82/large_f959831e-e2fd-46ac-a46d-9f393d65529e.jpeg",
};

export default async function AboutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  // Await searchParams to prevent serialization errors
  await searchParams;
  const t = await getTranslations("about");
  const tHome = await getTranslations("home");

  const defaultBarbers = [
    {
      id: "1",
      displayName: "Zyron",
      bio: "Russian-speaking barber in Berlin. Premium haircuts and styling.",
      languages: ["de", "ru", "en"],
      user: { email: "zyron@zyronstudio.de" },
    },
  ];

  const barbers = await safePrismaQuery(
    async () => {
      if (!prisma) {
        return defaultBarbers;
      }
      return await prisma.barber.findMany({
        where: {
          active: true,
        },
        include: {
          user: true,
        },
      });
    },
    defaultBarbers
  );

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

  const getBarberBio = (displayName: string, defaultBio: string | null) => {
    const bioKey = `barber${displayName}Bio` as keyof typeof t;
    try {
      return t(bioKey as any) || defaultBio || "\u00A0";
    } catch {
      return defaultBio || "\u00A0";
    }
  };

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative bg-black pt-24 sm:pt-28 lg:pt-32 pb-8 sm:pb-10 lg:pb-12">
        <div className="container-fluid">
          <div className="container-narrow text-center">
            <h1 className="text-hero font-bold mb-title text-white">
              {t("title")}
            </h1>
            <p className="text-body-large text-gray-300">
              {t("studioDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* Studio Story Section */}
      <section className="relative bg-black pt-8 sm:pt-10 lg:pt-12 pb-16 sm:pb-20 lg:pb-24 xl:pb-28 overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/50 to-black"></div>
        
        <div className="container-fluid relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Content Grid */}
            <div className="grid md:grid-cols-2 gap-10 sm:gap-12 lg:gap-14 xl:gap-16 items-center">
              {/* Text Content */}
              <div className="space-y-6 lg:space-y-7">
                <p className="text-body-large text-gray-300 leading-relaxed">
                  {t("studioDesc2")}
                </p>
                
                {/* Features List */}
                <div className="pt-6 lg:pt-7 border-t border-gray-800">
                  <ul className="space-y-4 lg:space-y-5">
                    <li className="flex items-start gap-3.5">
                      <div className="w-2.5 h-2.5 bg-primary rounded-full mt-2.5 flex-shrink-0"></div>
                      <span className="text-body text-gray-300 leading-relaxed flex-1">
                        {t("feature1")}
                      </span>
                    </li>
                    <li className="flex items-start gap-3.5">
                      <div className="w-2.5 h-2.5 bg-primary rounded-full mt-2.5 flex-shrink-0"></div>
                      <span className="text-body text-gray-300 leading-relaxed flex-1">
                        {t("feature2")}
                      </span>
                    </li>
                    <li className="flex items-start gap-3.5">
                      <div className="w-2.5 h-2.5 bg-primary rounded-full mt-2.5 flex-shrink-0"></div>
                      <span className="text-body text-gray-300 leading-relaxed flex-1">
                        {t("feature3")}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Visual Element */}
              <div className="relative w-full order-first md:order-last">
                <div className="relative aspect-[4/3] sm:aspect-[3/2] lg:aspect-[4/3] rounded-xl overflow-hidden shadow-2xl">
                  <Image
                    src="https://lh3.googleusercontent.com/p/AF1QipO7wL9ZuMDhgDxpY9spFKqRueStPxeh4rsagFRU=s2048-v1"
                    alt="Exzellenz in jedem Detail"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-black pt-section pb-16 sm:pb-20 lg:pb-24 xl:pb-28">
        <div className="container-fluid">
          <div className="text-center mb-section">
            <h2 className="text-section-title font-bold text-white">
              {t("whyChooseUs")}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-fluid max-w-5xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full mb-4 mx-auto">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-card-title font-bold mb-2 text-white">
                {t("professionalExcellence")}
              </h3>
              <p className="text-small text-gray-300">
                {t("professionalExcellenceDesc")}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full mb-4 mx-auto">
                <Languages className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-card-title font-bold mb-2 text-white">
                {t("multilingual")}
              </h3>
              <p className="text-small text-gray-300">
                {t("multilingualDesc")}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full mb-4 mx-auto">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-card-title font-bold mb-2 text-white">
                {t("modernTechniques")}
              </h3>
              <p className="text-small text-gray-300">
                {t("modernTechniquesDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Barbers Section */}
      <section className="relative bg-black pt-section pb-16 sm:pb-20 lg:pb-24 xl:pb-28 overflow-hidden">
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

    </main>
  );
}
