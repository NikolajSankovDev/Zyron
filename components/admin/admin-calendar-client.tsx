"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { format, isSameDay, startOfDay, endOfWeek, startOfWeek } from "date-fns";
import { Settings, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminCalendar, type RescheduleData } from "./AdminCalendar";
// import { AdminCalendarDebug } from "./AdminCalendarDebug"; // Keep for debugging if needed
import { CalendarSettingsModal } from "./calendar-settings";
import { AppointmentDetailPanel } from "./appointment-detail-panel";
import { CreateAppointmentDialog } from "./create-appointment-dialog";
import { RescheduleAppointmentDialog } from "./reschedule-appointment-dialog";
import { ManualRescheduleDialog } from "./manual-reschedule-dialog";
import { AddNoteDialog } from "./add-note-dialog";
import {
  loadCalendarSettings,
  saveCalendarSettings,
  getDefaultCalendarSettings,
} from "@/lib/utils/calendar";
import { deleteAppointmentAction, updateAppointmentStatusAction, rescheduleAppointmentAction, updateAppointmentNoteAction, updateAppointmentDurationAction } from "@/lib/actions/admin";
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

export function AdminCalendarClient({
  initialDate,
  barbers,
  appointments,
}: AdminCalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
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
  
  // Manual reschedule dialog state
  const [manualRescheduleDialogOpen, setManualRescheduleDialogOpen] = useState(false);
  
  // Note dialog state
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  
  // Barber selection dialog state (week view only)
  const [barberDialogOpen, setBarberDialogOpen] = useState(false);
  
  // Ref for buttons container
  const buttonsContainerRef = useRef<HTMLDivElement>(null);
  
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
    setIsMounted(true);
  }, [barbers]); // Include barbers in dependencies

  // Save settings when they change (only after mount)
  useEffect(() => {
    if (isMounted) {
      saveCalendarSettings(settings);
    }
  }, [settings, isMounted]);

  // Fix buttons positioning
  useEffect(() => {
    const fixButtonsPosition = () => {
      const buttonsContainer = buttonsContainerRef.current;
      if (buttonsContainer) {
        // Force correct positioning with inline styles
        const rightOffset = 16; // 1rem = 16px from the right edge
        
        buttonsContainer.style.setProperty('position', 'fixed', 'important');
        buttonsContainer.style.setProperty('bottom', '1rem', 'important');
        buttonsContainer.style.setProperty('right', `${rightOffset}px`, 'important');
        buttonsContainer.style.setProperty('z-index', '50', 'important');
      }
    };

    // Apply fix with delays to handle dynamic content
    fixButtonsPosition();
    setTimeout(fixButtonsPosition, 100);
    setTimeout(fixButtonsPosition, 500);
    setTimeout(fixButtonsPosition, 1000);
    
    // Also fix on resize
    window.addEventListener('resize', fixButtonsPosition);
    
    return () => {
      window.removeEventListener('resize', fixButtonsPosition);
    };
  }, [isMounted, viewMode]);

  // Filter appointments for current date/week
  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = startOfDay(new Date(apt.startTime));
    const currentDateStart = startOfDay(currentDate);
    
    if (viewMode === "day") {
      return isSameDay(aptDate, currentDateStart);
    } else {
      // Week view - show appointments from Monday to Sunday of the selected week
      const weekStart = startOfWeek(currentDateStart, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDateStart, { weekStartsOn: 1 });
      return aptDate >= weekStart && aptDate <= weekEnd;
    }
  });

  const handleSettingsChange = useCallback((newSettings: CalendarSettings) => {
    setSettings(newSettings);
  }, []);

  const handleViewChange = useCallback((view: "day" | "week") => {
    setViewMode(view as "day" | "week");
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

  // Confirm reschedule action (for drag-and-drop)
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

  // Handle manual reschedule (from menu)
  const handleManualReschedule = useCallback(async (
    appointmentId: string,
    newStartTime: Date,
    newEndTime: Date,
    newBarberId?: string
  ) => {
    const result = await rescheduleAppointmentAction(
      appointmentId,
      newStartTime.toISOString(),
      newEndTime.toISOString(),
      newBarberId
    );

    if (result.error) {
      alert(`Failed to reschedule: ${result.error}`);
      throw new Error(result.error);
    }

    // Refresh the page to show updated appointment
    window.location.reload();
  }, []);

  // Handle add/update note
  const handleUpdateNote = useCallback(async (appointmentId: string, notes: string) => {
    const result = await updateAppointmentNoteAction(appointmentId, notes);
    
    if (result.error) {
      alert(`Failed to update note: ${result.error}`);
      throw new Error(result.error);
    }

    // Refresh the page to show updated note
    window.location.reload();
  }, []);

  // Handle update duration
  const handleUpdateDuration = useCallback(async (appointmentId: string, durationMinutes: number) => {
    const result = await updateAppointmentDurationAction(appointmentId, durationMinutes);
    
    if (result.error) {
      alert(`Failed to update duration: ${result.error}`);
      return;
    }

    // Refresh the page to show updated appointment
    window.location.reload();
  }, []);



  return (
    <div className="relative h-full w-full m-0 p-0 text-white overflow-visible">

      {/* Calendar container - full height and width, no padding, no margins */}
      <div className="h-full w-full m-0 p-0 overflow-visible sm:overflow-hidden bg-white text-gray-900">
        <div className="h-full w-full overflow-visible sm:overflow-hidden">
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
            viewMode={viewMode as "day" | "week"}
            timeInterval={settings.timeInterval}
            onViewChange={handleViewChange}
            onDateChange={handleDateChange}
          />
        </div>
      </div>

      {/* Round icon buttons - bottom right, responsive sizing */}
      <div 
        ref={buttonsContainerRef}
        className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50 flex flex-col gap-2 sm:gap-3 lg:right-[calc(1rem+20rem)]"
        data-calendar-buttons
      >
        {/* Barber selector button - only in week view */}
        {viewMode === "week" && barbers.length > 0 && (
          <Button
            variant="outline"
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-gray-700 bg-gray-800 text-white shadow-lg hover:bg-gray-700 p-0"
            onClick={() => setBarberDialogOpen(true)}
            title="Select barber"
          >
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        )}
        <Button
          variant="outline"
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-gray-700 bg-gray-800 text-white shadow-lg hover:bg-gray-700 p-0"
          onClick={() => setSettingsOpen(true)}
          title="Settings"
        >
          <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <Button
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary shadow-lg hover:bg-primary/90 p-0"
          onClick={() => {
            setCreateDialogInitialDate(currentDate);
            setCreateDialogInitialTime(undefined);
            setCreateDialogInitialBarberId(undefined);
            setCreateDialogOpen(true);
          }}
          title="New appointment"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
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
          onMarkArrived={(id) => {
            handleUpdateStatus(id, "ARRIVED");
          }}
          onMarkMissed={(id) => {
            handleUpdateStatus(id, "MISSED");
          }}
          onMarkBooked={(id) => {
            handleUpdateStatus(id, "BOOKED");
          }}
          onReschedule={(id) => {
            setManualRescheduleDialogOpen(true);
          }}
          onAddNote={(id) => {
            setNoteDialogOpen(true);
          }}
          onUpdateDuration={handleUpdateDuration}
        />
      )}

      {/* Reschedule Appointment Dialog (for drag-and-drop) */}
      <RescheduleAppointmentDialog
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
        rescheduleData={rescheduleData}
        barbers={barbers}
        onConfirm={handleConfirmReschedule}
      />

      {/* Manual Reschedule Dialog (for menu option) */}
      <ManualRescheduleDialog
        open={manualRescheduleDialogOpen}
        onOpenChange={setManualRescheduleDialogOpen}
        appointment={selectedAppointment}
        barbers={barbers}
        onConfirm={handleManualReschedule}
      />

      {/* Add Note Dialog */}
      <AddNoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        appointment={selectedAppointment}
        onConfirm={handleUpdateNote}
      />

      {/* Barber Selection Dialog - Week View Only */}
      {viewMode === "week" && (
        <Dialog open={barberDialogOpen} onOpenChange={setBarberDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Select Barber
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-2">
                {barbers.map((barber) => (
                  <Button
                    key={barber.id}
                    variant={weekViewBarberId === barber.id ? "default" : "outline"}
                    className={`w-full justify-start ${
                      weekViewBarberId === barber.id
                        ? "bg-primary hover:bg-primary/90 text-white"
                        : "border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
                    }`}
                    onClick={() => {
                      setWeekViewBarberId(barber.id);
                      setBarberDialogOpen(false);
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    {barber.displayName}
                  </Button>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
