"use client";

import { useState, useEffect } from "react";
import { format, setHours, setMinutes, startOfDay } from "date-fns";
import { Plus } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { createAdminAppointmentAction } from "@/lib/actions/admin";
import { useTranslations } from "next-intl";
import type { BarberDisplayData } from "@/lib/types/admin-calendar";

interface Service {
  id: number;
  slug: string;
  durationMinutes: number;
  basePrice: number;
  translations: Array<{
    name: string;
    description?: string;
  }>;
}

interface CreateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barbers: BarberDisplayData[];
  initialDate?: Date;
  initialTime?: string;
  initialBarberId?: string;
  onSuccess?: () => void;
}

export function CreateAppointmentDialog({
  open,
  onOpenChange,
  barbers,
  initialDate,
  initialTime,
  initialBarberId,
  onSuccess,
}: CreateAppointmentDialogProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedBarberId, setSelectedBarberId] = useState(initialBarberId || "");
  const [selectedDate, setSelectedDate] = useState(
    initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [selectedTime, setSelectedTime] = useState(initialTime || "09:00");
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [notes, setNotes] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("admin");

  // Load services
  useEffect(() => {
    if (open) {
      fetch("/api/services?locale=en")
        .then((res) => res.json())
        .then((data) => setServices(data.services || []))
        .catch((err) => {
          console.error("Failed to load services:", err);
          setError("Failed to load services");
        });
    }
  }, [open]);

  const handleServiceToggle = (serviceId: number) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!selectedBarberId) {
      setError("Please select a barber");
      setLoading(false);
      return;
    }

    if (selectedServiceIds.length === 0) {
      setError("Please select at least one service");
      setLoading(false);
      return;
    }

    // Combine date and time - parse date string manually to avoid timezone issues
    // Parse date string (yyyy-MM-dd) in local timezone
    const [year, month, day] = selectedDate.split("-").map(Number);
    const [hours, minutes] = selectedTime.split(":").map(Number);
    
    // Create date in local timezone (month is 0-indexed in Date constructor)
    const appointmentDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

    const formData = new FormData();
    formData.append("customerName", customerName);
    formData.append("customerEmail", customerEmail);
    formData.append("customerPhone", customerPhone || "");
    formData.append("barberId", selectedBarberId);
    formData.append("startTime", appointmentDate.toISOString());
    formData.append("serviceIds", JSON.stringify(selectedServiceIds));
    formData.append("notes", notes);

    const result = await createAdminAppointmentAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Reset form
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setSelectedServiceIds([]);
      setNotes("");
      setError(null);
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Create Appointment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Customer Information</h3>
            <div>
              <Label htmlFor="customerName" className="text-gray-400 text-sm mb-1 block">
                Name *
              </Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Customer name"
              />
            </div>
            <div>
              <Label htmlFor="customerEmail" className="text-gray-400 text-sm mb-1 block">
                Email *
              </Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="customer@example.com"
              />
            </div>
            <div>
              <Label htmlFor="customerPhone" className="text-gray-400 text-sm mb-1 block">
                Phone
              </Label>
              <Input
                id="customerPhone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Appointment Details</h3>
            <div>
              <Label htmlFor="barber" className="text-gray-400 text-sm mb-1 block">
                Barber *
              </Label>
              <Select value={selectedBarberId} onValueChange={setSelectedBarberId} required>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="text-gray-400 text-sm mb-1 block">
                  Date *
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
                  Time *
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
          </div>

          {/* Services */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">{t("services")} *</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {services.map((service) => {
                const translation = service.translations[0];
                const isSelected = selectedServiceIds.includes(service.id);
                return (
                  <div
                    key={service.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleServiceToggle(service.id)}
                      className="border-gray-700 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">
                        {translation?.name || service.slug}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {service.durationMinutes} min • €{Number(service.basePrice).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-gray-400 text-sm mb-1 block">
              Notes
            </Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[80px] rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Additional notes..."
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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary/90"
            >
              {loading ? "Creating..." : "Create Appointment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

