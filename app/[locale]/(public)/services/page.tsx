import { safePrismaQuery } from "@/lib/prisma";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export default async function ServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  // Await searchParams to prevent serialization errors
  await searchParams;
  const t = await getTranslations("services");
  
  // Default placeholder services (fallback if database is not available)
  const defaultServices = [
    {
      id: 1,
      slug: "haircut",
      durationMinutes: 45,
      basePrice: 40.0,
      translations: [{ name: "Haarschnitt", description: "Professioneller Haarschnitt" }],
    },
    {
      id: 2,
      slug: "haircut-beard-hot-towel",
      durationMinutes: 60,
      basePrice: 75.0,
      translations: [{ name: "Haarschnitt & Bartpflege + Heiße Handtuch-Rasur", description: "Ein umfassender Service" }],
    },
  ];

  // Always use safePrismaQuery - it will return fallback if database is not available
  const services = await safePrismaQuery(
    async () => {
      if (!prisma) {
        return defaultServices;
      }
      return await prisma.service.findMany({
        where: {
          active: true,
        },
        include: {
          translations: {
            where: {
              locale: locale as string,
            },
          },
        },
      });
    },
    defaultServices
  );

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

      {/* Services Grid */}
      <section className="py-section">
        <div className="container-fluid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-fluid max-w-6xl mx-auto">
            {services.map((service: any) => {
              const translation = service.translations?.[0];
              return (
                <div 
                  key={service.id}
                  className="bg-gray-900 rounded-xl p-5 sm:p-6 border-2 border-transparent hover:border-primary transition-all flex flex-col"
                >
                  <div className="flex-grow">
                    <h3 className="text-card-title font-semibold mb-2 text-white">
                      {translation?.name || service.slug}
                    </h3>
                    {translation?.description && (
                      <p className="text-body text-gray-300">
                        {translation.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-5 pt-4 border-t border-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="text-small text-gray-400">
                        {service.durationMinutes} min
                      </span>
                      <span className="text-card-title font-bold text-primary">
                        €{Number(service.basePrice).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      
      {!process.env.DATABASE_URL && (
        <section className="pb-section">
          <div className="container-fluid">
            <div className="max-w-6xl mx-auto">
              <div className="p-4 bg-gray-900 rounded-lg text-small text-gray-400 border border-gray-800">
                <p>Note: Database not connected. Showing placeholder services.</p>
                <p className="mt-2">To connect a database, set DATABASE_URL in your .env file and run <code className="bg-black px-2 py-1 rounded">npm run db:push</code></p>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
