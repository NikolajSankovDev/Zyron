"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createServiceAction } from "@/lib/actions/service";
import { useTranslations } from "next-intl";

interface AddServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AVAILABLE_LOCALES = [
  { code: "de", label: "German" },
  { code: "en", label: "English" },
  { code: "ru", label: "Russian" },
];

export function AddServiceDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddServiceDialogProps) {
  const [slug, setSlug] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [basePrice, setBasePrice] = useState<number>(0);
  const [active, setActive] = useState(true);
  const [order, setOrder] = useState<number>(0);
  const [translations, setTranslations] = useState<
    Array<{ locale: string; name: string; description: string }>
  >(
    AVAILABLE_LOCALES.map((locale) => ({
      locale: locale.code,
      name: "",
      description: "",
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");

  // Reset form when dialog closes
  const resetForm = () => {
    setSlug("");
    setDurationMinutes(30);
    setBasePrice(0);
    setActive(true);
    setOrder(0);
    setTranslations(
      AVAILABLE_LOCALES.map((locale) => ({
        locale: locale.code,
        name: "",
        description: "",
      }))
    );
    setError(null);
  };

  const updateTranslation = (
    locale: string,
    field: "name" | "description",
    value: string
  ) => {
    setTranslations((prev) =>
      prev.map((translation) =>
        translation.locale === locale
          ? { ...translation, [field]: value }
          : translation
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate that all translations have names
    const missingNames = translations.filter((trans) => !trans.name.trim());
    if (missingNames.length > 0) {
      setError("Service name is required for all languages");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("slug", slug);
    formData.append("durationMinutes", durationMinutes.toString());
    formData.append("basePrice", basePrice.toString());
    formData.append("active", active.toString());
    formData.append("order", order.toString());
    formData.append(
      "translations",
      JSON.stringify(
        translations.map((trans) => ({
          locale: trans.locale,
          name: trans.name.trim(),
          description: trans.description.trim() || null,
        }))
      )
    );

    const result = await createServiceAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      resetForm();
      setLoading(false);
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{t("addService")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Information */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="slug" className="text-gray-400 text-sm mb-1 block">
                {t("serviceSlug")} *
              </Label>
              <Input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().trim())}
                required
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="haircut-beard-trim"
              />
              <p className="text-xs text-gray-500 mt-1">
                Lowercase letters, numbers, hyphens, and underscores only
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label
                  htmlFor="durationMinutes"
                  className="text-gray-400 text-sm mb-1 block"
                >
                  {t("serviceDuration")} *
                </Label>
                <Input
                  id="durationMinutes"
                  type="number"
                  min="1"
                  value={durationMinutes}
                  onChange={(e) =>
                    setDurationMinutes(parseInt(e.target.value, 10) || 1)
                  }
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label
                  htmlFor="basePrice"
                  className="text-gray-400 text-sm mb-1 block"
                >
                  {t("servicePrice")} *
                </Label>
                <Input
                  id="basePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={basePrice}
                  onChange={(e) =>
                    setBasePrice(parseFloat(e.target.value) || 0)
                  }
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="order" className="text-gray-400 text-sm mb-1 block">
                {t("serviceOrder")}
              </Label>
              <Input
                id="order"
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Translations */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">
              {t("serviceName")} * ({t("translations")})
            </h3>
            {AVAILABLE_LOCALES.map((locale) => {
              const translation = translations.find((t) => t.locale === locale.code);
              return (
                <div key={locale.code} className="space-y-2 p-3 rounded-lg bg-gray-800/50">
                  <Label className="text-gray-300 text-sm font-medium">
                    {locale.label} ({locale.code})
                  </Label>
                  <Input
                    type="text"
                    value={translation?.name || ""}
                    onChange={(e) =>
                      updateTranslation(locale.code, "name", e.target.value)
                    }
                    required
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder={`${t("serviceName")} (${locale.label})`}
                  />
                  <textarea
                    value={translation?.description || ""}
                    onChange={(e) =>
                      updateTranslation(locale.code, "description", e.target.value)
                    }
                    className="w-full min-h-[60px] rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={`${t("serviceDescription")} (${locale.label})`}
                  />
                </div>
              );
            })}
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
            <Checkbox
              checked={active}
              onCheckedChange={(checked) => setActive(checked === true)}
              className="border-gray-700 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
            />
            <div className="flex-1">
              <Label htmlFor="active" className="text-white text-sm font-medium cursor-pointer">
                {t("serviceActive")}
              </Label>
              <div className="text-gray-400 text-xs">
                {active
                  ? "Service will be visible to customers"
                  : "Service will be hidden from customers"}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? tCommon("loading") : t("addService")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

