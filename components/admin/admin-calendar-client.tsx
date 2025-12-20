"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format, isSameDay, startOfDay, startOfMonth, endOfMonth, endOfWeek, startOfWeek } from "date-fns";
import { Settings, Plus } from "lucide-react";
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

  return (
    <div className="flex h-full flex-col gap-4 rounded-xl border border-gray-800 bg-gray-900 p-4 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {viewMode === "week" && barbers.length > 0 && (
            <>
              <span className="text-sm text-gray-300">Barber</span>
              <Select
                value={weekViewBarberId || barbers[0]?.id}
                onValueChange={setWeekViewBarberId}
              >
                <SelectTrigger className="w-48 border-gray-700 bg-gray-800 text-white">
                  <SelectValue placeholder="Select barber" />
                </SelectTrigger>
                <SelectContent>
                  {barbers.map((barber) => (
                    <SelectItem key={barber.id} value={barber.id}>
                      {barber.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button
            onClick={() => {
              setCreateDialogInitialDate(currentDate);
              setCreateDialogInitialTime(undefined);
              setCreateDialogInitialBarberId(undefined);
              setCreateDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            New appointment
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden rounded-lg bg-white p-2 text-gray-900">
        {settingsReady ? (
          <div className="h-full">
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
          </div>
        ) : (
          <CalendarSkeleton />
        )}
      </div>

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

      {/* Appointment Detail Panel */}
      {selectedAppointment && (
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
            console.log("Reschedule:", id);
          }}
          onBookAgain={(id) => {
            console.log("Book again:", id);
          }}
          onAddService={(id) => {
            console.log("Add service:", id);
          }}
          onAddNote={(id) => {
            console.log("Add note:", id);
          }}
        />
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
