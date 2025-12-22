"use client";

import { useState, useEffect, useRef } from "react";
import { format, setHours, setMinutes, startOfDay } from "date-fns";
import { Plus, X } from "lucide-react";
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

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

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

  // Customer search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setSearchQuery("");
      setSearchResults([]);
      setShowSearchResults(false);
      setSelectedCustomer(null);
      setSelectedServiceIds([]);
      setNotes("");
      setError(null);
    }
  }, [open]);

  // Search customers with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/customers/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        setSearchResults(data.customers || []);
        setShowSearchResults(true);
      } catch (err) {
        console.error("Failed to search customers:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Handle click outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerEmail(customer.email);
    setCustomerPhone(customer.phone || "");
    setSearchQuery(customer.name);
    setShowSearchResults(false);
    setSearchResults([]);
  };

  // Handle customer name change
  const handleCustomerNameChange = (value: string) => {
    setSearchQuery(value);
    setCustomerName(value);
    
    // If customer was selected and user is editing, clear selection
    if (selectedCustomer && value !== selectedCustomer.name) {
      setSelectedCustomer(null);
      setCustomerEmail("");
      setCustomerPhone("");
    }
  };

  // Clear customer selection
  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

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
      // Reset form (handled by useEffect when dialog closes)
      setLoading(false);
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
            <div className="relative" ref={searchContainerRef}>
              <Label htmlFor="customerName" className="text-gray-400 text-sm mb-1 block">
                Name *
              </Label>
              <div className="relative">
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => handleCustomerNameChange(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowSearchResults(true);
                    }
                  }}
                  required
                  className="bg-gray-800 border-gray-700 text-white pr-10"
                  placeholder="Type name or email to search..."
                />
                {selectedCustomer && (
                  <button
                    type="button"
                    onClick={handleClearCustomer}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    aria-label="Clear customer selection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {isSearching && (
                    <div className="p-3 text-sm text-gray-400 text-center">
                      Searching...
                    </div>
                  )}
                  {!isSearching && searchResults.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleCustomerSelect(customer)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                    >
                      <div className="text-white font-medium">{customer.name}</div>
                      <div className="text-gray-400 text-sm">{customer.email}</div>
                      {customer.phone && (
                        <div className="text-gray-500 text-xs mt-1">{customer.phone}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              {showSearchResults && !isSearching && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
                <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg p-3">
                  <div className="text-gray-400 text-sm text-center">No customers found</div>
                </div>
              )}
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
                disabled={!!selectedCustomer}
                className="bg-gray-800 border-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={!!selectedCustomer}
                className="bg-gray-800 border-gray-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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

