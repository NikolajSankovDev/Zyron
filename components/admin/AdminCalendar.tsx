"use client";

import { useMemo, useCallback } from "react";
import { Calendar, dateFnsLocalizer, SlotInfo, View, Views, type ResourceHeaderProps } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek as dateFnsStartOfWeek, getDay } from "date-fns";
import { de, enUS, ru } from "date-fns/locale";
import { useLocale } from "next-intl";
import type { AppointmentDisplayData, BarberDisplayData } from "@/lib/types/admin-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

// Create drag and drop enabled calendar
const DragAndDropCalendar = withDragAndDrop(Calendar);

// Types for drag and drop
interface RescheduleData {
  appointment: AppointmentDisplayData;
  newStart: Date;
  newEnd: Date;
  newBarberId?: string;
}

// Map locale strings to date-fns locales
const locales = { de, en: enUS, ru };

// Create localizer with date-fns
const startOfWeek = (date: Date, options?: { locale?: any }) => {
  return dateFnsStartOfWeek(date, { weekStartsOn: 1, ...options });
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: {
    de,
    en: enUS,
    ru,
  },
});

interface AdminCalendarProps {
  date: Date;
  barbers: BarberDisplayData[];
  appointments: AppointmentDisplayData[];
  onAppointmentClick?: (appointment: AppointmentDisplayData) => void;
  onCellClick?: (date: Date, barberId: string) => void;
  onAppointmentReschedule?: (data: RescheduleData) => void;
  selectedBarberIds?: string[];
  timeRange?: {
    start: string; // "HH:mm"
    end: string; // "HH:mm"
  };
  viewMode?: "day" | "week" | "month";
  timeInterval?: 15 | 30 | 60;
  intervalHeight?: "small" | "medium" | "large";
  onViewChange?: (view: "day" | "week" | "month") => void;
  onDateChange?: (date: Date) => void;
}

// Export RescheduleData type for use in parent components
export type { RescheduleData };

// Map view modes
const viewMap: Record<string, View> = {
  day: Views.DAY,
  week: Views.WEEK,
  month: Views.MONTH,
};

type CalendarResource = {
  id: string;
  title: string;
};

// Custom header cell content (keep a single root node so the grid layout stays intact)
const ResourceHeader = ({ label, resource }: ResourceHeaderProps<CalendarResource>) => (
  <div className="admin-calendar__resource-header-cell">
    <span className="admin-calendar__resource-name">
      {(label ?? resource?.title ?? "") as React.ReactNode}
    </span>
  </div>
);

const TimeGutterHeader = () => (
  <div className="admin-calendar__resource-header-cell admin-calendar__resource-header-cell--gutter">
    <span className="admin-calendar__time-label">Time</span>
  </div>
);

export function AdminCalendar({
  date,
  barbers,
  appointments,
  onAppointmentClick,
  onCellClick,
  onAppointmentReschedule,
  selectedBarberIds,
  timeRange = { start: "09:00", end: "20:00" },
  viewMode = "day",
  timeInterval = 15,
  intervalHeight = "medium",
  onViewChange,
  onDateChange,
}: AdminCalendarProps) {
  const locale = useLocale();

  // Filter barbers based on selection
  const visibleBarbers = useMemo(() => {
    if (!selectedBarberIds || selectedBarberIds.length === 0) {
      return barbers;
    }
    return barbers.filter((barber) => selectedBarberIds.includes(barber.id));
  }, [barbers, selectedBarberIds]);

  // Transform barbers to resources
  const resources = useMemo<CalendarResource[] | undefined>(() => {
    if (viewMode !== "day") return undefined;

    return visibleBarbers.map((barber) => ({
      id: String(barber.id),
      title: barber.displayName,
    }));
  }, [visibleBarbers, viewMode]);

  // Transform appointments to events
  const events = useMemo(() => {
    const selectedSet = selectedBarberIds?.length
      ? new Set(selectedBarberIds.map((id) => String(id)))
      : null;

    const baseEvents = appointments
      .filter((apt) => {
        if (!selectedSet) return true;
        return selectedSet.has(String(apt.barberId));
      })
      .map((apt) => {
        const start = apt.startTime instanceof Date ? apt.startTime : new Date(apt.startTime);
        const end = apt.endTime instanceof Date ? apt.endTime : new Date(apt.endTime);

        return {
          id: apt.id,
          title: apt.customerName || "",
          start,
          end,
          appointment: apt,
          resourceId: String(apt.barberId),
        };
      })
      .filter((event) => !isNaN(event.start.getTime()) && !isNaN(event.end.getTime()));

    if (!resources) {
      return baseEvents;
    }

    const validResourceIds = new Set(resources.map((resource) => String(resource.id)));

    return baseEvents.filter((event) => validResourceIds.has(event.resourceId));
  }, [appointments, resources, selectedBarberIds]);

  // Handle event click
  const handleSelectEvent = useCallback((event: any) => {
    if (onAppointmentClick && event.appointment) {
      onAppointmentClick(event.appointment);
    }
  }, [onAppointmentClick]);

  // Handle slot click
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    const slotStart = slotInfo.start;
    const barberId = slotInfo.resourceId as string || visibleBarbers[0]?.id;
    
    if (!barberId || !onCellClick) return;
    
    onCellClick(slotStart, barberId);
  }, [onCellClick, visibleBarbers]);

  // Handle view change
  const handleViewChange = useCallback((view: View) => {
    if (onViewChange) {
      const viewString = view === Views.DAY ? "day" : view === Views.WEEK ? "week" : "month";
      onViewChange(viewString as "day" | "week" | "month");
    }
  }, [onViewChange]);

  // Handle navigation
  const handleNavigate = useCallback((newDate: Date) => {
    if (onDateChange) {
      onDateChange(newDate);
    }
  }, [onDateChange]);

  // Handle event drag and drop
  const handleEventDrop = useCallback(({ event, start, end, resourceId }: any) => {
    if (!onAppointmentReschedule || !event.appointment) return;
    
    const appointment = event.appointment as AppointmentDisplayData;
    const newBarberId = resourceId as string | undefined;
    
    onAppointmentReschedule({
      appointment,
      newStart: start,
      newEnd: end,
      newBarberId: newBarberId !== appointment.barberId ? newBarberId : undefined,
    });
  }, [onAppointmentReschedule]);

  if (visibleBarbers.length === 0) {
    return <div>No barbers selected</div>;
  }

  return (
    <div className="admin-calendar" style={{ height: '100%' }}>
      <DragAndDropCalendar
        localizer={localizer}
        events={events}
        {...(viewMode === "day" && resources
          ? {
              resources,
              resourceIdAccessor: "id",
              resourceTitleAccessor: "title",
              resourceAccessor: "resourceId",
            }
          : {})}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        defaultView={viewMap[viewMode]}
        view={viewMap[viewMode]}
        views={[Views.DAY, Views.WEEK, Views.MONTH]}
        defaultDate={date}
        date={date}
        step={timeInterval}
        timeslots={2}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        onEventDrop={handleEventDrop}
        onView={handleViewChange}
        onNavigate={handleNavigate}
        selectable
        culture={locale}
        toolbar
        components={{
          resourceHeader: ResourceHeader,
          timeGutterHeader: TimeGutterHeader,
        }}
      />
    </div>
  );
}
