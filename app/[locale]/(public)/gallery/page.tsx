import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GalleryImage } from "@/components/ui/gallery-image";

const galleryImages = [
  "/images/gallery/gallery-1.jpeg",
  "/images/gallery/gallery-2.jpeg",
  "/images/gallery/gallery-3.jpeg",
  "/images/gallery/gallery-4.jpeg",
];

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Await searchParams to prevent serialization errors
  await searchParams;
  
  const locale = await getLocale();
  const t = await getTranslations("gallery");

  return (
    <main className="min-h-screen bg-black">
      {/* Header Section */}
      <section className="bg-black pt-24 sm:pt-28 lg:pt-32">
        <div className="container-fluid">
          <div className="container-narrow text-center">
            <h1 className="text-hero font-bold mb-title text-white">
              {t("title")}
            </h1>
            <p className="text-body-large text-gray-300">
              {t("description")}
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-section">
        <div className="container-fluid">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-fluid max-w-6xl mx-auto">
            {galleryImages.map((image, index) => (
              <div 
                key={index} 
                className="relative aspect-[3/4] rounded-lg overflow-hidden group cursor-pointer"
              >
                <GalleryImage
                  src={image}
                  alt={`${t("galleryImage")} ${index + 1}`}
                  index={index}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-black py-8 sm:py-10 lg:py-12 overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/50 to-black"></div>
        
        <div className="container-fluid relative z-10">
          <div className="container-narrow text-center">
            <h2 className="text-card-title font-bold mb-2 text-white">
              {t("ctaTitle")}
            </h2>
            <p className="text-body text-gray-300 mb-4 sm:mb-5">
              {t("ctaDescription")}
            </p>
            <Link href={`/${locale}/book`}>
              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2.5 text-sm rounded-lg"
              >
                {t("bookAppointment")}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
