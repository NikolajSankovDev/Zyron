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
import { createBarberAction } from "@/lib/actions/barber";
import { useTranslations } from "next-intl";

interface AddBarberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function AddBarberDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddBarberDialogProps) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/admin/add-barber-dialog.tsx:AddBarberDialog:render',message:'AddBarberDialog component render',data:{open},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/admin/add-barber-dialog.tsx:AddBarberDialog:open-changed',message:'AddBarberDialog open prop changed',data:{open},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }, [open]);
  // #endregion

  // Reset form when dialog closes
  const resetForm = () => {
    setEmail("");
    setName("");
    setPhone("");
    setDisplayName("");
    setSelectedLanguages([]);
    setBio("");
    setError(null);
  };

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

    if (selectedLanguages.length === 0) {
      setError("Please select at least one language");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("email", email);
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("displayName", displayName);
    formData.append("languages", JSON.stringify(selectedLanguages));
    if (bio) formData.append("bio", bio);

    const result = await createBarberAction(formData);

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
          <DialogTitle className="text-white">{t("addBarber")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Barber Information */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="email" className="text-gray-400 text-sm mb-1 block">
                {t("barberEmail")} *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="barber@example.com"
              />
            </div>
            <div>
              <Label htmlFor="name" className="text-gray-400 text-sm mb-1 block">
                {t("barberName")} *
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-gray-400 text-sm mb-1 block">
                {t("barberPhone")} *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="+49 30 12345678"
              />
            </div>
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
              {loading ? tCommon("loading") : t("addBarber")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

