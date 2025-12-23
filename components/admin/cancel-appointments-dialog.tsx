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
import { cancelBarberAppointmentsAction } from "@/lib/actions/barber";
import { useTranslations } from "next-intl";
import { format } from "date-fns";

interface CancelAppointmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barberId: string;
  barberName: string;
  onSuccess?: () => void;
}

export function CancelAppointmentsDialog({
  open,
  onOpenChange,
  barberId,
  barberName,
  onSuccess,
}: CancelAppointmentsDialogProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [appointmentCount, setAppointmentCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");

  // Initialize with today's date
  useEffect(() => {
    if (open) {
      const today = format(new Date(), "yyyy-MM-dd'T'HH:mm");
      setStartDate(today);
      // Default to same day, end of day
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 0);
      setEndDate(format(endOfDay, "yyyy-MM-dd'T'HH:mm"));
      setReason("");
      setAppointmentCount(null);
      setError(null);
    }
  }, [open]);

  // Fetch appointment count when dates change
  useEffect(() => {
    if (open && startDate && endDate && barberId) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end > start) {
        setLoadingCount(true);
        fetch(
          `/api/barbers/${barberId}/appointments/count?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
        )
          .then((res) => res.json())
          .then((data) => {
            setAppointmentCount(data.count ?? 0);
            setLoadingCount(false);
          })
          .catch((err) => {
            console.error("Failed to fetch appointment count:", err);
            setAppointmentCount(null);
            setLoadingCount(false);
          });
      } else {
        setAppointmentCount(null);
      }
    }
  }, [open, startDate, endDate, barberId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      setLoading(false);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      setError("End date must be after start date");
      setLoading(false);
      return;
    }

    if (appointmentCount === 0) {
      setError("No appointments found in this date range");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("startDate", start.toISOString());
    formData.append("endDate", end.toISOString());
    if (reason) formData.append("reason", reason);

    const result = await cancelBarberAppointmentsAction(barberId, formData);

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
          <DialogTitle className="text-white">
            {t("cancelBarberAppointments")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm text-gray-400 mb-4">
            Canceling appointments for{" "}
            <span className="text-white font-medium">{barberName}</span>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="startDate" className="text-gray-400 text-sm mb-1 block">
                {t("startDate")} *
              </Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="endDate" className="text-gray-400 text-sm mb-1 block">
                {t("endDate")} *
              </Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Appointment Count */}
          {loadingCount ? (
            <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-400 text-sm">
              Loading appointment count...
            </div>
          ) : appointmentCount !== null ? (
            <div
              className={`p-3 rounded-lg border ${
                appointmentCount > 0
                  ? "bg-yellow-500/10 border-yellow-500/50 text-yellow-400"
                  : "bg-gray-800/50 border-gray-700 text-gray-400"
              } text-sm`}
            >
              {appointmentCount > 0
                ? `${appointmentCount} appointment${appointmentCount !== 1 ? "s" : ""} will be canceled`
                : "No appointments found in this date range"}
            </div>
          ) : null}

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
              placeholder="e.g., Barber is sick, Emergency closure..."
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
              onClick={() => onOpenChange(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading || appointmentCount === 0 || loadingCount}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading
                ? tCommon("loading")
                : `Cancel ${appointmentCount ?? 0} Appointment${(appointmentCount ?? 0) !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

