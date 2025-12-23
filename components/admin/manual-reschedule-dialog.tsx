"use client";

import { useState, useEffect } from "react";
import { format, addMinutes } from "date-fns";
import { Calendar, Clock, User } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AppointmentDisplayData, BarberDisplayData } from "@/lib/types/admin-calendar";

interface ManualRescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentDisplayData | null;
  barbers: BarberDisplayData[];
  onConfirm: (appointmentId: string, newStartTime: Date, newEndTime: Date, newBarberId?: string) => Promise<void>;
}

export function ManualRescheduleDialog({
  open,
  onOpenChange,
  appointment,
  barbers,
  onConfirm,
}: ManualRescheduleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedBarberId, setSelectedBarberId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("admin");

  // Initialize form when dialog opens
  useEffect(() => {
    if (open && appointment) {
      const startDate = new Date(appointment.startTime);
      setSelectedDate(format(startDate, "yyyy-MM-dd"));
      setSelectedTime(format(startDate, "HH:mm"));
      setSelectedBarberId(appointment.barberId);
      setError(null);
    }
  }, [open, appointment]);

  const handleConfirm = async () => {
    if (!appointment) return;

    setError(null);
    setLoading(true);

    try {
      // Parse date and time
      const [year, month, day] = selectedDate.split("-").map(Number);
      const [hours, minutes] = selectedTime.split(":").map(Number);
      
      // Create new start time in local timezone
      const newStart = new Date(year, month - 1, day, hours, minutes, 0, 0);
      
      // Calculate duration from original appointment
      const originalStart = new Date(appointment.startTime);
      const originalEnd = new Date(appointment.endTime);
      const durationMinutes = Math.round(
        (originalEnd.getTime() - originalStart.getTime()) / (1000 * 60)
      );
      
      // Calculate new end time
      const newEnd = addMinutes(newStart, durationMinutes);

      const newBarberId = selectedBarberId !== appointment.barberId ? selectedBarberId : undefined;

      await onConfirm(appointment.id, newStart, newEnd, newBarberId);
      onOpenChange(false);
    } catch (error: any) {
      setError(error.message || "Failed to reschedule appointment");
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  const originalStart = new Date(appointment.startTime);
  const originalEnd = new Date(appointment.endTime);
  const durationMinutes = Math.round(
    (originalEnd.getTime() - originalStart.getTime()) / (1000 * 60)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Reschedule Appointment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current Appointment Info */}
          <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Current Appointment</div>
            <div className="text-white font-medium">{appointment.customerName}</div>
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
              <Clock className="h-3 w-3" />
              {format(originalStart, "HH:mm")} - {format(originalEnd, "HH:mm")} ({durationMinutes} min)
            </div>
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              {format(originalStart, "EEEE, d MMMM yyyy")}
            </div>
          </div>

          {/* New Date & Time */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="text-gray-400 text-sm mb-1 block">
                  New Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="time" className="text-gray-400 text-sm mb-1 block">
                  New Time *
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>

            {/* Barber Selection */}
            <div>
              <Label htmlFor="barber" className="text-gray-400 text-sm mb-1 block">
                Barber
              </Label>
              <Select value={selectedBarberId} onValueChange={setSelectedBarberId}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                  <SelectValue placeholder="Select a barber" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  {barbers.map((barber) => (
                    <SelectItem
                      key={barber.id}
                      value={barber.id}
                      className="text-white focus:bg-gray-800 cursor-pointer"
                    >
                      {barber.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
              {error}
            </div>
          )}
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

