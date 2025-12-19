"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, addMonths, subMonths, isSameDay, startOfDay, startOfMonth, endOfMonth, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Settings, Plus, CalendarDays, CalendarRange, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminCalendar, type RescheduleData } from "./AdminCalendar";
// import { AdminCalendarDebug } from "./AdminCalendarDebug"; // Keep for debugging if needed
import { CalendarSettingsModal } from "./calendar-settings";
import { CalendarSkeleton } from "./CalendarSkeleton";
import { AppointmentDetailPanel } from "./appointment-detail-panel";
import { CreateAppointmentDialog } from "./create-appointment-dialog";
import { RescheduleAppointmentDialog } from "./reschedule-appointment-dialog";
import {
  loadCalendarSettings,
  saveCalendarSettings,
  getDefaultCalendarSettings,
} from "@/lib/utils/calendar";
import { deleteAppointmentAction, updateAppointmentStatusAction, rescheduleAppointmentAction } from "@/lib/actions/admin";
import type {
  AppointmentDisplayData,
  BarberDisplayData,
  CalendarSettings,
} from "@/lib/types/admin-calendar";

interface AdminCalendarClientProps {
  initialDate: Date;
  barbers: BarberDisplayData[];
  appointments: AppointmentDisplayData[];
}

type ViewMode = "day" | "week" | "month";

export function AdminCalendarClient({
  initialDate,
  barbers,
  appointments,
}: AdminCalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [weekViewBarberId, setWeekViewBarberId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Listen for date changes from mini calendar
  useEffect(() => {
    const handleMiniCalendarDateSelect = (event: CustomEvent) => {
      setCurrentDate(new Date(event.detail));
    };

    window.addEventListener("mini-calendar-date-select" as any, handleMiniCalendarDateSelect);
    return () => {
      window.removeEventListener("mini-calendar-date-select" as any, handleMiniCalendarDateSelect);
    };
  }, []);

  // Notify mini calendar of date changes
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("calendar-date-change", { detail: currentDate })
    );
  }, [currentDate]);
  // Initialize settings with defaults (same on server and client)
  const getInitialSettings = (): CalendarSettings => {
    const barbersForSettings = barbers.map(b => ({ workingHours: b.workingHours }));
    const defaults = getDefaultCalendarSettings(barbersForSettings);
    // Initialize with all barbers selected
    if (barbers.length > 0) {
      defaults.selectedBarberIds = barbers.map((b) => b.id);
    }
    return defaults;
  };

  // Always use defaults initially (same on server and client)
  // This ensures server and client render identical HTML initially
  const [settings, setSettings] = useState<CalendarSettings>(getInitialSettings);
  const [settingsReady, setSettingsReady] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDisplayData | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogInitialDate, setCreateDialogInitialDate] = useState<Date | undefined>();
  const [createDialogInitialTime, setCreateDialogInitialTime] = useState<string | undefined>();
  const [createDialogInitialBarberId, setCreateDialogInitialBarberId] = useState<string | undefined>();
  
  // Reschedule dialog state
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [rescheduleData, setRescheduleData] = useState<RescheduleData | null>(null);
  
  // Compute filtered barber IDs
  // For week view, only show the selected barber
  const effectiveSelectedBarberIds = useMemo(() => {
    if (viewMode === "week") {
      // Use the week view barber if set, otherwise use first selected barber
      const barberId = weekViewBarberId || settings.selectedBarberIds[0];
      return barberId ? [barberId] : [];
    }
    return settings.selectedBarberIds;
  }, [settings.selectedBarberIds, viewMode, weekViewBarberId]);

  // Set initial week view barber when switching to week view
  useEffect(() => {
    if (viewMode === "week" && !weekViewBarberId && settings.selectedBarberIds.length > 0) {
      setWeekViewBarberId(settings.selectedBarberIds[0]);
    }
  }, [viewMode, weekViewBarberId, settings.selectedBarberIds]);
  
  // Load settings from localStorage after mount (client-side only)
  // This prevents hydration mismatch while still loading user preferences
  useEffect(() => {
    // Load settings from localStorage after mount
    const barbersForSettings = barbers.map(b => ({ workingHours: b.workingHours }));
    const loaded = loadCalendarSettings(barbersForSettings);
    const merged = { ...getInitialSettings(), ...loaded };
    // Ensure barbers are selected if none selected
    if (merged.selectedBarberIds.length === 0 && barbers.length > 0) {
      merged.selectedBarberIds = barbers.map((b) => b.id);
    }
    setSettings(merged);
    setSettingsReady(true); // Mark settings as ready
    setIsMounted(true);
  }, [barbers]); // Include barbers in dependencies

  // Save settings when they change (only after mount)
  useEffect(() => {
    if (isMounted) {
      saveCalendarSettings(settings);
    }
  }, [settings, isMounted]);

  // Filter appointments for current date/week/month
  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = startOfDay(new Date(apt.startTime));
    const currentDateStart = startOfDay(currentDate);
    
    if (viewMode === "day") {
      return isSameDay(aptDate, currentDateStart);
    } else if (viewMode === "week") {
      // Week view - show appointments from Monday to Sunday of the selected week
      const weekStart = startOfWeek(currentDateStart, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDateStart, { weekStartsOn: 1 });
      return aptDate >= weekStart && aptDate <= weekEnd;
    } else {
      // Month view
      const monthStart = startOfMonth(currentDateStart);
      const monthEnd = endOfMonth(currentDateStart);
      return aptDate >= monthStart && aptDate <= monthEnd;
    }
  });

  const handlePrevious = useCallback(() => {
    if (viewMode === "day") {
      setCurrentDate(prev => subDays(prev, 1));
    } else if (viewMode === "week") {
      setCurrentDate(prev => subWeeks(prev, 1));
    } else {
      setCurrentDate(prev => subMonths(prev, 1));
    }
  }, [viewMode]);

  const handleNext = useCallback(() => {
    if (viewMode === "day") {
      setCurrentDate(prev => addDays(prev, 1));
    } else if (viewMode === "week") {
      setCurrentDate(prev => addWeeks(prev, 1));
    } else {
      setCurrentDate(prev => addMonths(prev, 1));
    }
  }, [viewMode]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleSettingsChange = useCallback((newSettings: CalendarSettings) => {
    setSettings(newSettings);
  }, []);

  const handleViewChange = useCallback((view: ViewMode) => {
    setViewMode(view);
  }, []);

  const handleDateChange = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const handleDeleteAppointment = useCallback(async (appointmentId: string) => {
    if (isDeleting) return;
    
    const confirmed = window.confirm("Are you sure you want to delete this appointment? This action cannot be undone.");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const result = await deleteAppointmentAction(appointmentId);
      if (result.error) {
        alert(`Failed to delete appointment: ${result.error}`);
      } else {
        setSelectedAppointment(null);
        // Refresh the page to show updated appointments
        window.location.reload();
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("An error occurred while deleting the appointment.");
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting]);

  const handleUpdateStatus = useCallback(async (appointmentId: string, status: "BOOKED" | "ARRIVED" | "MISSED" | "CANCELED" | "COMPLETED") => {
    try {
      const result = await updateAppointmentStatusAction(appointmentId, status);
      if (result.error) {
        alert(`Failed to update status: ${result.error}`);
      } else {
        setSelectedAppointment(null);
        // Refresh the page to show updated status
        window.location.reload();
      }
    } catch (error) {
      console.error("Status update error:", error);
      alert("An error occurred while updating the status.");
    }
  }, []);

  // Handle appointment drag and drop reschedule
  const handleAppointmentReschedule = useCallback((data: RescheduleData) => {
    setRescheduleData(data);
    setRescheduleDialogOpen(true);
  }, []);

  // Confirm reschedule action
  const handleConfirmReschedule = useCallback(async (data: RescheduleData) => {
    const result = await rescheduleAppointmentAction(
      data.appointment.id,
      data.newStart.toISOString(),
      data.newEnd.toISOString(),
      data.newBarberId
    );

    if (result.error) {
      alert(`Failed to reschedule: ${result.error}`);
      throw new Error(result.error);
    }

    // Refresh the page to show updated appointment
    window.location.reload();
  }, []);

  const formatDateDisplay = (date: Date) => {
    if (viewMode === "day") {
      return format(date, "EEEE, d MMMM yyyy");
    } else if (viewMode === "week") {
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      return `${format(weekStart, "d MMM")} – ${format(weekEnd, "d MMM yyyy")}`;
    } else {
      return format(date, "MMMM yyyy");
    }
  };

  const isToday = isSameDay(currentDate, new Date());

  return (
    <div className="flex flex-col flex-1 min-h-0 -mb-4 sm:-mb-6 lg:-mb-8">
      {/* Header with Date Navigation - Light & Clean Design */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 mb-6 rounded-xl border border-gray-200 bg-white shadow-md flex-shrink-0">
        <div className="flex flex-wrap items-center gap-4">
          {/* View Toggle with Sliding Indicator */}
          <div className="relative flex items-center gap-1.5 p-1.5 rounded-lg bg-gray-100 border border-gray-200">
            <button
              onClick={() => setViewMode("day")}
              className={`relative z-10 flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                viewMode === "day"
                  ? "text-white"
                  : "text-gray-900"
              }`}
            >
              {viewMode === "day" && (
                <div className="absolute inset-0 rounded-lg bg-blue-600 shadow-md -z-10" />
              )}
              <CalendarDays className="h-4 w-4" />
              <span>Day</span>
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`relative z-10 flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                viewMode === "week"
                  ? "text-white"
                  : "text-gray-900"
              }`}
            >
              {viewMode === "week" && (
                <div className="absolute inset-0 rounded-lg bg-blue-600 shadow-md -z-10" />
              )}
              <CalendarRange className="h-4 w-4" />
              <span>Week</span>
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="h-11 w-11 rounded-lg bg-gray-100 border border-gray-200 text-gray-900 hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <button
              onClick={handleToday}
              className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 border ${
                isToday
                  ? "bg-blue-50 text-blue-600 border-blue-300 shadow-sm"
                  : "text-gray-900 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              Today
            </button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="h-11 w-11 rounded-lg bg-gray-100 border border-gray-200 text-gray-900 hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Current Date Display */}
          <div className="text-2xl font-bold text-gray-900 tracking-tight">
            {formatDateDisplay(currentDate)}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Week View Barber Selector */}
          {viewMode === "week" && barbers.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200">
              <User className="h-4 w-4 text-blue-600" />
              <Select
                value={weekViewBarberId || barbers[0]?.id}
                onValueChange={setWeekViewBarberId}
              >
                <SelectTrigger className="bg-transparent border-none text-gray-900 font-medium h-auto p-0 gap-2 hover:text-blue-600 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 rounded-lg">
                  {barbers.map((barber) => (
                    <SelectItem key={barber.id} value={barber.id} className="text-gray-900 focus:bg-blue-50 rounded-md">
                      {barber.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            className="h-11 w-11 rounded-lg bg-gray-100 border border-gray-200 text-gray-900 hover:border-blue-300 hover:bg-blue-50 transition-all"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Calendar - White card on dark background */}
      <div className="relative w-full flex-1 min-h-0">
        {settingsReady ? (
          <AdminCalendar
            date={currentDate}
            barbers={barbers}
            appointments={filteredAppointments}
            onAppointmentClick={setSelectedAppointment}
            onCellClick={(date, barberId) => {
              setCreateDialogInitialDate(date);
              setCreateDialogInitialTime(format(date, "HH:mm"));
              setCreateDialogInitialBarberId(barberId);
              setCreateDialogOpen(true);
            }}
            onAppointmentReschedule={handleAppointmentReschedule}
            selectedBarberIds={effectiveSelectedBarberIds}
            timeRange={settings.timeRange}
            viewMode={viewMode}
            timeInterval={settings.timeInterval}
            intervalHeight={settings.intervalHeight}
            onViewChange={handleViewChange}
            onDateChange={handleDateChange}
          />
        ) : (
          <CalendarSkeleton />
        )}
      </div>

      {/* Floating Action Button - Blue Gradient */}
      <Button
        onClick={() => {
          setCreateDialogInitialDate(currentDate);
          setCreateDialogInitialTime(undefined);
          setCreateDialogInitialBarberId(undefined);
          setCreateDialogOpen(true);
        }}
        className="group fixed bottom-6 right-6 lg:bottom-8 lg:right-8 h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 z-50 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center"
        size="icon"
      >
        <Plus className="h-7 w-7 text-white transition-transform group-hover:rotate-90 duration-300" />
      </Button>

      {/* Settings Modal */}
      <CalendarSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        barbers={barbers}
      />

      {/* Create Appointment Dialog */}
      <CreateAppointmentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        barbers={barbers}
        initialDate={createDialogInitialDate}
        initialTime={createDialogInitialTime}
        initialBarberId={createDialogInitialBarberId}
        onSuccess={() => {
          // Refresh the page to show new appointment
          window.location.reload();
        }}
      />

      {/* Appointment Detail Panel - Overlay */}
      {selectedAppointment && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSelectedAppointment(null)}
          />
          <AppointmentDetailPanel
            appointment={selectedAppointment}
            onClose={() => setSelectedAppointment(null)}
            onDelete={handleDeleteAppointment}
            onCheckout={(id) => {
              handleUpdateStatus(id, "COMPLETED");
            }}
            onMarkArrived={(id) => {
              handleUpdateStatus(id, "ARRIVED");
            }}
            onMarkMissed={(id) => {
              handleUpdateStatus(id, "MISSED");
            }}
            onReschedule={(id) => {
              // TODO: Open reschedule dialog
              console.log("Reschedule:", id);
            }}
            onBookAgain={(id) => {
              // TODO: Open booking dialog with same customer/service
              console.log("Book again:", id);
            }}
            onAddService={(id) => {
              // TODO: Open add service dialog
              console.log("Add service:", id);
            }}
            onAddNote={(id) => {
              // TODO: Open add note dialog
              console.log("Add note:", id);
            }}
          />
        </>
      )}

      {/* Reschedule Appointment Dialog */}
      <RescheduleAppointmentDialog
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
        rescheduleData={rescheduleData}
        barbers={barbers}
        onConfirm={handleConfirmReschedule}
      />
    </div>
  );
}
