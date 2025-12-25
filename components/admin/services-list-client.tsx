"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { AddServiceDialog } from "./add-service-dialog";
import { EditServiceDialog } from "./edit-service-dialog";
import { toggleServiceActiveAction } from "@/lib/actions/service";
import { useRouter } from "next/navigation";

interface ServiceTranslation {
  locale: string;
  name: string;
  description?: string | null;
}

interface Service {
  id: number;
  slug: string;
  durationMinutes: number;
  basePrice: number;
  active: boolean;
  order: number;
  translations: ServiceTranslation[];
  _count: {
    appointmentServices: number;
  };
}

interface ServicesListClientProps {
  services: Service[];
}

export function ServicesListClient({ services: initialServices }: ServicesListClientProps) {
  const [services, setServices] = useState(initialServices);

  // Update state when props change (after router.refresh())
  useEffect(() => {
    setServices(initialServices);
  }, [initialServices]);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [togglingActive, setTogglingActive] = useState<number | null>(null);
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const handleAddSuccess = () => {
    router.refresh();
  };

  const handleEditSuccess = () => {
    router.refresh();
  };

  const handleToggleActive = async (serviceId: number) => {
    if (togglingActive) return;
    setTogglingActive(serviceId);
    try {
      const result = await toggleServiceActiveAction(serviceId);
      if (result?.success) {
        router.refresh();
      } else if (result?.error) {
        alert(result.error);
      }
    } catch (error: any) {
      console.error("Toggle exception:", error);
    } finally {
      setTogglingActive(null);
    }
  };

  const handleEditClick = (service: Service) => {
    setSelectedService(service);
    setEditDialogOpen(true);
  };

  return (
    <>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 lg:h-full flex flex-col lg:overflow-y-auto overflow-visible min-h-0" data-admin-page="services">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 flex-shrink-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{t("services")}</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">{t("manageServiceOfferings")}</p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="bg-primary hover:bg-primary/90 w-full sm:w-auto text-sm sm:text-base"
          type="button"
        >
          {t("addService")}
        </Button>
      </div>

      <Card className="bg-gray-900 border-gray-800 flex flex-col lg:flex-1 lg:min-h-0">
        <CardHeader className="flex-shrink-0 px-3 sm:px-6">
          <CardTitle className="text-base sm:text-lg text-white">{t("allServices")}</CardTitle>
        </CardHeader>
        <CardContent className="lg:flex-1 lg:overflow-y-auto lg:min-h-0 px-3 sm:px-6 pb-8 lg:pb-6">
          {services.length === 0 ? (
            <p className="text-sm sm:text-base text-gray-400">
              {t("noServicesFound")} {!process.env.DATABASE_URL && "Database not connected."}
            </p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="p-3 sm:p-4 border border-gray-800 rounded-lg bg-black/50"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 sm:gap-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white text-sm sm:text-base">{service.slug}</p>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        {t("duration")}: {service.durationMinutes} min
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        {t("price")}: €{service.basePrice.toFixed(2)}
                      </p>
                      <p className="text-xs sm:text-sm text-white mt-1">
                        {t("usedIn")}: {service._count?.appointmentServices || 0} {t("appointments")}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center flex-shrink-0 w-full sm:w-auto">
                      <button
                        onClick={() => handleToggleActive(service.id)}
                        disabled={togglingActive === service.id}
                        className={`text-xs px-2 py-1 rounded whitespace-nowrap border cursor-pointer transition-colors ${
                          service.active
                            ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
                            : "bg-gray-700 text-gray-400 border-gray-600 hover:bg-gray-600"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {togglingActive === service.id
                          ? tCommon("loading")
                          : service.active
                          ? t("active")
                          : t("inactive")}
                      </button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEditClick(service);
                        }}
                        className="border-gray-700 text-white hover:bg-gray-800 text-xs sm:text-sm"
                        type="button"
                      >
                        {tCommon("edit")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddServiceDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleAddSuccess}
      />
      {selectedService && (
        <EditServiceDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) {
              setSelectedService(null);
            }
          }}
          service={selectedService}
          onSuccess={handleEditSuccess}
        />
      )}
      </div>
    </>
  );
}

