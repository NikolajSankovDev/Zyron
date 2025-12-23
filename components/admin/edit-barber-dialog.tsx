"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
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
import { updateBarberAction } from "@/lib/actions/barber";
import { useTranslations } from "next-intl";

interface Barber {
  id: string;
  displayName: string;
  languages: string[];
  bio?: string | null;
  active: boolean;
  user: {
    email: string;
    name: string;
    phone: string;
  };
}

interface EditBarberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barber: Barber | null;
  onSuccess?: () => void;
}

const AVAILABLE_LANGUAGES = [
  { code: "de", label: "German" },
  { code: "en", label: "English" },
  { code: "ru", label: "Russian" },
  { code: "uk", label: "Ukrainian" },
  { code: "bg", label: "Bulgarian" },
  { code: "tk", label: "Turkmen" },
  { code: "uz", label: "Uzbek" },
];

export function EditBarberDialog({
  open,
  onOpenChange,
  barber,
  onSuccess,
}: EditBarberDialogProps) {
  const [displayName, setDisplayName] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");

  // Initialize form when barber changes
  useEffect(() => {
    if (barber) {
      setDisplayName(barber.displayName || "");
      setSelectedLanguages(barber.languages || []);
      setBio(barber.bio || "");
      setActive(barber.active ?? true);
      setError(null);
    }
  }, [barber]);

  const handleLanguageToggle = (languageCode: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(languageCode)
        ? prev.filter((code) => code !== languageCode)
        : [...prev, languageCode]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!barber) {
      setError("Barber not found");
      setLoading(false);
      return;
    }

    if (selectedLanguages.length === 0) {
      setError("Please select at least one language");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("displayName", displayName);
    formData.append("languages", JSON.stringify(selectedLanguages));
    formData.append("bio", bio || "");
    formData.append("active", active.toString());

    const result = await updateBarberAction(barber.id, formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setLoading(false);
      onOpenChange(false);
      onSuccess?.();
    }
  };

  if (!barber) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{t("editBarber")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Barber Information (Read-only) */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">
              Barber Information
            </h3>
            <div>
              <Label className="text-gray-400 text-sm mb-1 block">
                {t("barberEmail")}
              </Label>
              <Input
                type="email"
                value={barber.user.email}
                disabled
                className="bg-gray-800 border-gray-700 text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <Label className="text-gray-400 text-sm mb-1 block">
                {t("barberName")}
              </Label>
              <Input
                type="text"
                value={barber.user.name}
                disabled
                className="bg-gray-800 border-gray-700 text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <Label className="text-gray-400 text-sm mb-1 block">
                {t("barberPhone")}
              </Label>
              <Input
                type="tel"
                value={barber.user.phone}
                disabled
                className="bg-gray-800 border-gray-700 text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="displayName" className="text-gray-400 text-sm mb-1 block">
                {t("barberDisplayName")} *
              </Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="John"
              />
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">{t("barberLanguages")} *</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {AVAILABLE_LANGUAGES.map((language) => {
                const isSelected = selectedLanguages.includes(language.code);
                return (
                  <div
                    key={language.code}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleLanguageToggle(language.code)}
                      className="border-gray-700 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">
                        {language.label}
                      </div>
                      <div className="text-gray-400 text-xs">{language.code}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio" className="text-gray-400 text-sm mb-1 block">
              {t("barberBio")}
            </Label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full min-h-[80px] rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Optional bio description..."
            />
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
                {t("active")}
              </Label>
              <div className="text-gray-400 text-xs">
                {active
                  ? "Barber will be visible in customer booking"
                  : "Barber will be hidden from customer booking"}
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
              onClick={() => onOpenChange(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? tCommon("loading") : tCommon("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

