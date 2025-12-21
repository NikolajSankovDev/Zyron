"use client";

import { useMemo, useCallback, useEffect } from "react";
import { Calendar, dateFnsLocalizer, SlotInfo, View, Views, type ResourceHeaderProps, type EventProps } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek as dateFnsStartOfWeek, getDay } from "date-fns";
import { de, enUS, ru } from "date-fns/locale";
import { useLocale } from "next-intl";
import type { AppointmentDisplayData, BarberDisplayData, AppointmentStatus } from "@/lib/types/admin-calendar";
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
  viewMode?: "day" | "week";
  timeInterval?: 15 | 30 | 60;
  intervalHeight?: "small" | "medium" | "large";
  onViewChange?: (view: "day" | "week") => void;
  onDateChange?: (date: Date) => void;
}

// Export RescheduleData type for use in parent components
export type { RescheduleData };

// Map view modes
const viewMap: Record<string, View> = {
  day: Views.DAY,
  week: Views.WEEK,
};

type CalendarResource = {
  id: string;
  title: string;
};

const DEFAULT_DAY_START = "10:00";
const DEFAULT_DAY_END = "20:00";
const BREAK_START_MINUTES = 14 * 60 + 30; // 14:30
const BREAK_END_MINUTES = 15 * 60; // 15:00
const CLOSED_DAY = 0; // Sunday

const toMinutes = (timeStr: string, fallback: string): number => {
  const [h, m] = (timeStr || fallback).split(":").map(Number);
  const hours = Number.isFinite(h) ? h : 0;
  const minutes = Number.isFinite(m) ? m : 0;
  return hours * 60 + minutes;
};

const minutesToDate = (baseDate: Date, minutes: number): Date => {
  const clamped = Math.min(24 * 60, Math.max(0, minutes));
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  const date = new Date(baseDate);
  date.setHours(hours, mins, 0, 0);
  return date;
};

const getPaddingMinutes = (interval: number): number => {
  return interval === 15 ? 45 : 60;
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

// Status color mapping
const STATUS_COLORS: Record<AppointmentStatus, { bg: string; border: string; text: string }> = {
  BOOKED: { bg: "#EFF6FF", border: "#3B82F6", text: "#1E40AF" },      // Blue
  ARRIVED: { bg: "#F0FDF4", border: "#22C55E", text: "#166534" },     // Green
  COMPLETED: { bg: "#F9FAFB", border: "#9CA3AF", text: "#4B5563" },   // Gray
  MISSED: { bg: "#FEF2F2", border: "#EF4444", text: "#991B1B" },      // Red
  CANCELED: { bg: "#FFF7ED", border: "#F97316", text: "#9A3412" },    // Orange
};

// Custom event component for appointment display
interface CalendarEventData {
  id: string;
  title: string;
  start: Date;
  end: Date;
  appointment: AppointmentDisplayData;
  resourceId: string;
}

const CalendarEvent = ({ event }: EventProps<CalendarEventData>) => {
  const appointment = event.appointment;
  if (!appointment) return <span>{event.title}</span>;

  const startTime = format(new Date(appointment.startTime), "HH:mm");
  const endTime = format(new Date(appointment.endTime), "HH:mm");
  const services = appointment.services.map((s) => s.serviceName).join(", ");
  const statusColors = STATUS_COLORS[appointment.status] || STATUS_COLORS.BOOKED;

  return (
    <div
      className="calendar-event"
      style={{
        borderLeftColor: statusColors.border,
        backgroundColor: statusColors.bg,
        color: statusColors.text,
      }}
    >
      <div className="calendar-event__time">
        {startTime} - {endTime}
      </div>
      <div className="calendar-event__customer">
        {appointment.customerName}
      </div>
      {services && (
        <div className="calendar-event__services">
          {services}
        </div>
      )}
    </div>
  );
};

// Event prop getter for status-based styling
const eventPropGetter = (event: CalendarEventData) => {
  const appointment = event.appointment;
  if (!appointment) return {};

  const statusColors = STATUS_COLORS[appointment.status] || STATUS_COLORS.BOOKED;

  return {
    className: `calendar-event-wrapper calendar-event-wrapper--${appointment.status.toLowerCase()}`,
    style: {
      backgroundColor: statusColors.bg,
      borderColor: statusColors.border,
      color: statusColors.text,
    },
  };
};

export function AdminCalendar({
  date,
  barbers,
  appointments,
  onAppointmentClick,
  onCellClick,
  onAppointmentReschedule,
  selectedBarberIds,
  timeRange = { start: "10:00", end: "20:00" },
  viewMode = "day",
  timeInterval = 15,
  intervalHeight = "medium",
  onViewChange,
  onDateChange,
}: AdminCalendarProps) {
  const locale = useLocale();
  const localeForFormat = useMemo(() => locales[locale as keyof typeof locales] || enUS, [locale]);

  const workingHoursConfig = useMemo(() => {
    const defaultStart = toMinutes(DEFAULT_DAY_START, DEFAULT_DAY_START);
    const defaultEnd = toMinutes(DEFAULT_DAY_END, DEFAULT_DAY_END);
    const userStart = toMinutes(timeRange.start ?? DEFAULT_DAY_START, DEFAULT_DAY_START);
    const userEnd = toMinutes(timeRange.end ?? DEFAULT_DAY_END, DEFAULT_DAY_END);

    // Clamp to working window (10:00 - 20:00) but allow narrowing inside it
    const dayStartMinutes = Math.max(defaultStart, userStart);
    const dayEndMinutes = Math.max(dayStartMinutes, Math.min(defaultEnd, userEnd));
    const paddingMinutes = getPaddingMinutes(timeInterval);

    const minTime = minutesToDate(date, dayStartMinutes - paddingMinutes);
    const maxTime = minutesToDate(date, dayEndMinutes + paddingMinutes);

    const openIntervals = [
      { start: dayStartMinutes, end: Math.min(BREAK_START_MINUTES, dayEndMinutes) },
      { start: Math.max(BREAK_END_MINUTES, dayStartMinutes), end: dayEndMinutes },
    ].filter(({ start, end }) => end > start);

    return {
      openIntervals,
      minTime,
      maxTime,
    };
  }, [date, timeInterval, timeRange.end, timeRange.start]);

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
      const viewString = view === Views.DAY ? "day" : "week";
      onViewChange(viewString as "day" | "week");
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

  const slotPropGetter = useCallback(
    (slotDate: Date) => {
      const day = slotDate.getDay();
      if (day === CLOSED_DAY) {
        return { className: "admin-calendar__slot--closed" };
      }

      const minutes = slotDate.getHours() * 60 + slotDate.getMinutes();
      const isOpen = workingHoursConfig.openIntervals.some(
        ({ start, end }) => minutes >= start && minutes < end
      );

      return {
        className: isOpen ? undefined : "admin-calendar__slot--closed",
      };
    },
    [workingHoursConfig.openIntervals]
  );

  // Apply inline styles to week view headers (workaround for CSS not applying)
  useEffect(() => {
    if (viewMode !== 'week') return;
    
    const applyStyles = () => {
      const headers = document.querySelectorAll('.admin-calendar .rbc-time-header-content > .rbc-row:first-child > .rbc-header');
      const content = document.querySelector('.admin-calendar .rbc-time-header-content');
      const row = document.querySelector('.admin-calendar .rbc-time-header-content > .rbc-row:first-child');
      
      if (content) {
        (content as HTMLElement).style.setProperty('display', 'table', 'important');
        (content as HTMLElement).style.setProperty('width', '100%', 'important');
        (content as HTMLElement).style.setProperty('table-layout', 'fixed', 'important');
      }
      
      if (row) {
        (row as HTMLElement).style.setProperty('display', 'table-row', 'important');
      }
      
      headers.forEach((header: Element) => {
        const el = header as HTMLElement;
        el.style.setProperty('display', 'table-cell', 'important');
        el.style.setProperty('height', '48px', 'important');
        el.style.setProperty('min-height', '48px', 'important');
        el.style.setProperty('width', 'auto', 'important');
        el.style.setProperty('vertical-align', 'middle', 'important');
      });
    };
    
    // Apply immediately and after delays to catch all render cycles
    applyStyles();
    const timeouts = [100, 300, 500].map(delay => setTimeout(applyStyles, delay));
    return () => timeouts.forEach(clearTimeout);
  }, [viewMode, date]);

  // Week header component - styled exactly like barber headers
  const WeekHeader = useCallback(({ date, label }: { date: Date; label?: string; localizer?: any }) => {
    if (!date) {
      return (
        <div className="admin-calendar__resource-header-cell">
          <span className="admin-calendar__resource-name">{label || ""}</span>
        </div>
      );
    }
    
    const weekday = format(date, "EEE", { locale: localeForFormat });
    const dayNumber = format(date, "dd.MM", { locale: localeForFormat });
    const displayText = `${weekday} ${dayNumber}`;

    return (
      <div className="admin-calendar__resource-header-cell">
        <span className="admin-calendar__resource-name">
          {displayText}
        </span>
      </div>
    );
  }, [localeForFormat]);

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
        views={[Views.DAY, Views.WEEK]}
        defaultDate={date}
        date={date}
        step={timeInterval}
        timeslots={1}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        onEventDrop={handleEventDrop}
        onView={handleViewChange}
        onNavigate={handleNavigate}
        selectable
        min={workingHoursConfig.minTime}
        max={workingHoursConfig.maxTime}
        slotPropGetter={slotPropGetter}
        eventPropGetter={eventPropGetter as any}
        culture={locale}
        toolbar
        showMultiDayTimes={false}
        formats={{
          eventTimeRangeFormat: () => "",
          // Don't set dayHeaderFormat - let the custom component handle it
        }}
        components={{
          resourceHeader: ResourceHeader,
          timeGutterHeader: TimeGutterHeader,
          event: CalendarEvent as any,
          week: { 
            header: WeekHeader as any,
          },
        }}
      />
    </div>
  );
}
