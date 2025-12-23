"use client";

import { useState, useEffect } from "react";
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
import { createBarberTimeOffAction } from "@/lib/actions/barber";
import { useTranslations } from "next-intl";
import { format } from "date-fns";

interface BarberTimeOffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barberId: string;
  barberName: string;
  onSuccess?: () => void;
}

export function BarberTimeOffDialog({
  open,
  onOpenChange,
  barberId,
  barberName,
  onSuccess,
}: BarberTimeOffDialogProps) {
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [reason, setReason] = useState("");
  const [cancelAppointments, setCancelAppointments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");

  // Initialize with today's date
  useEffect(() => {
    if (open) {
      const today = format(new Date(), "yyyy-MM-dd'T'HH:mm");
      setStartDateTime(today);
      // Default to same day, end of day
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 0);
      setEndDateTime(format(endOfDay, "yyyy-MM-dd'T'HH:mm"));
      setReason("");
      setCancelAppointments(false);
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!startDateTime || !endDateTime) {
      setError("Please select both start and end dates");
      setLoading(false);
      return;
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (end <= start) {
      setError("End date must be after start date");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("startDateTime", start.toISOString());
    formData.append("endDateTime", end.toISOString());
    if (reason) formData.append("reason", reason);
    formData.append("cancelAppointments", cancelAppointments.toString());

    const result = await createBarberTimeOffAction(barberId, formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setLoading(false);
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{t("addTimeOff")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm text-gray-400 mb-4">
            Adding time off for <span className="text-white font-medium">{barberName}</span>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="startDateTime" className="text-gray-400 text-sm mb-1 block">
                {t("startDate")} *
              </Label>
              <Input
                id="startDateTime"
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="endDateTime" className="text-gray-400 text-sm mb-1 block">
                {t("endDate")} *
              </Label>
              <Input
                id="endDateTime"
                type="datetime-local"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason" className="text-gray-400 text-sm mb-1 block">
              {t("reason")} (Optional)
            </Label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full min-h-[80px] rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Holiday, Sick leave, Personal time..."
            />
          </div>

          {/* Cancel Appointments Option */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700">
            <Checkbox
              checked={cancelAppointments}
              onCheckedChange={(checked) => setCancelAppointments(checked === true)}
              className="border-gray-700 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500 mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="cancelAppointments" className="text-white text-sm font-medium cursor-pointer">
                {t("cancelAppointments")}
              </Label>
              <div className="text-gray-400 text-xs mt-1">
                Cancel all existing appointments during this time period
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
              {loading ? tCommon("loading") : t("addTimeOff")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

