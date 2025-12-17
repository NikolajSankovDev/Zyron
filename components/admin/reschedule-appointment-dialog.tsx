"use client";

import { useState } from "react";
import { format } from "date-fns";
import { de, enUS, ru } from "date-fns/locale";
import { Calendar, Clock, ArrowRight, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AppointmentDisplayData, BarberDisplayData } from "@/lib/types/admin-calendar";

const locales = { de, en: enUS, ru };

interface RescheduleData {
  appointment: AppointmentDisplayData;
  newStart: Date;
  newEnd: Date;
  newBarberId?: string;
}

interface RescheduleAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rescheduleData: RescheduleData | null;
  barbers: BarberDisplayData[];
  onConfirm: (data: RescheduleData) => Promise<void>;
}

export function RescheduleAppointmentDialog({
  open,
  onOpenChange,
  rescheduleData,
  barbers,
  onConfirm,
}: RescheduleAppointmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const locale = useLocale();
  const t = useTranslations("admin");
  const dateLocale = locales[locale as keyof typeof locales] || locales.de;

  if (!rescheduleData) return null;

  const { appointment, newStart, newEnd, newBarberId } = rescheduleData;
  
  // Get barber names
  const originalBarber = barbers.find(b => b.id === appointment.barberId);
  const newBarber = newBarberId ? barbers.find(b => b.id === newBarberId) : originalBarber;
  const barberChanged = newBarberId && newBarberId !== appointment.barberId;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(rescheduleData);
      onOpenChange(false);
    } catch (error) {
      console.error("Reschedule error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date: Date) => {
    return format(date, "HH:mm, EEEE, d MMMM yyyy", { locale: dateLocale });
  };

  const formatTime = (date: Date) => {
    return format(date, "HH:mm");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-semibold">
            {t("rescheduleAppointment") || "Reschedule Appointment"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Customer & Service Info */}
          <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
            <div className="flex items-center gap-2 text-white font-medium">
              <User className="h-4 w-4 text-gray-400" />
              {appointment.customerName}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {appointment.services.map(s => s.serviceName).join(", ")}
            </div>
          </div>

          {/* From */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {t("from") || "From"}
            </div>
            <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-white">
                  {formatTime(new Date(appointment.startTime))} - {formatTime(new Date(appointment.endTime))}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-300 text-sm">
                  {format(new Date(appointment.startTime), "EEEE, d MMMM yyyy", { locale: dateLocale })}
                </span>
              </div>
              {originalBarber && (
                <div className="text-sm text-gray-400 mt-1">
                  {t("with") || "with"} {originalBarber.displayName}
                </div>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowRight className="h-5 w-5 text-primary" />
          </div>

          {/* To */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-primary uppercase tracking-wide">
              {t("to") || "To"}
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-white font-medium">
                  {formatTime(newStart)} - {formatTime(newEnd)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-gray-300 text-sm">
                  {format(newStart, "EEEE, d MMMM yyyy", { locale: dateLocale })}
                </span>
              </div>
              {newBarber && (
                <div className={`text-sm mt-1 ${barberChanged ? 'text-primary font-medium' : 'text-gray-400'}`}>
                  {t("with") || "with"} {newBarber.displayName}
                  {barberChanged && <span className="ml-1 text-xs">(changed)</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            {t("cancel") || "Cancel"}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? (t("saving") || "Saving...") : (t("confirm") || "Confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
