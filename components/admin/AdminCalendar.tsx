"use client";

import { useMemo, useCallback, useEffect, useRef, type CSSProperties } from "react";
import { Calendar, dateFnsLocalizer, SlotInfo, View, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek as dateFnsStartOfWeek, getDay, setHours, setMinutes, startOfDay } from "date-fns";
import { de, enUS, ru } from "date-fns/locale";
import { useLocale } from "next-intl";
import Image from "next/image";
import type { AppointmentDisplayData, BarberDisplayData } from "@/lib/types/admin-calendar";
import { getIntervalHeight } from "@/lib/utils/calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "./admin-calendar.css";

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
  // Day view: show all selected barbers as columns
  // Week view: no resources (shows days across the week for a single barber)
  const resources = useMemo(() => {
    if (viewMode !== "day") return undefined;

    return visibleBarbers.map((barber) => ({
      id: String(barber.id),
      title: barber.displayName,
      barber,
    }));
  }, [visibleBarbers, viewMode]);

  // Resource header - modern glass design with larger avatars
  const ResourceHeader = useCallback(({ resource }: { resource: any }) => {
    const barber = resource.barber as BarberDisplayData | undefined;
    const displayName = barber?.displayName || resource.title;
    const initials = displayName
      ? displayName
          .split(" ")
          .map((namePart) => namePart.charAt(0))
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "";
    const workingHours = barber?.workingHours
      ? `${barber.workingHours.startTime} – ${barber.workingHours.endTime}`
      : null;

    return (
      <div className="group relative flex items-center gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-all duration-300">
        <div className="relative">
          {/* Avatar with blue ring */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-0.5 ring-2 ring-blue-200 group-hover:ring-blue-400 transition-all duration-300">
            {barber?.avatar ? (
              <Image
                src={barber.avatar}
                alt={displayName}
                width={48}
                height={48}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 text-sm font-bold text-gray-900">
                {initials}
              </div>
            )}
          </div>
          {/* Online status indicator */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-md" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 tracking-tight truncate">
            {displayName}
          </h3>
          {workingHours && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-medium text-gray-900">
                {workingHours}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }, []);

  // Event component - modern glass card with neo-brutalist borders
  const EventComponent = useCallback(({ event }: { event: any }) => {
    const appointment = event.appointment as AppointmentDisplayData | undefined;
    if (!appointment) {
      return <div className="rbc-event-card">{event.title}</div>;
    }

    const start = event.start instanceof Date ? event.start : new Date(event.start);
    const end = event.end instanceof Date ? event.end : new Date(event.end);

    const displayStartTime = format(start, "HH:mm");
    const displayEndTime = format(end, "HH:mm");

    // Get service name
    const serviceName = appointment.services && appointment.services.length > 0
      ? appointment.services[0].serviceName
      : "Service";

    // Status color mapping - blue theme
    const statusColors = {
      BOOKED: "rgba(0, 113, 227, 0.6)",
      ARRIVED: "rgba(52, 199, 89, 0.6)",
      COMPLETED: "rgba(48, 209, 88, 0.6)",
      MISSED: "rgba(255, 59, 48, 0.6)",
      CANCELED: "rgba(142, 142, 147, 0.6)",
    };
    const eventColor = statusColors[appointment.status] || statusColors.BOOKED;

    return (
      <div
        className="rbc-event-card"
        style={{
          ["--event-color" as string]: eventColor
        }}
      >
        {/* Status indicator - top right corner */}
        <div className="rbc-event-status-badge" />

        {/* Content */}
        <div className="rbc-event-card-content">
          {/* Time with icon */}
          <div className="rbc-event-time">
            <svg className="w-3.5 h-3.5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>
              {displayStartTime} - {displayEndTime}
            </span>
          </div>

          {/* Customer name */}
          <h4 className="rbc-event-customer">
            {appointment.customerName}
          </h4>

          {/* Service */}
          <p className="rbc-event-service">
            {serviceName}
          </p>
        </div>
      </div>
    );
  }, []);

  // Transform appointments to events
  const events = useMemo(() => {
    // For week view without resources, show all appointments
    if (!resources && viewMode === "week") {
      return appointments.map((apt) => {
        const start = apt.startTime instanceof Date ? apt.startTime : new Date(apt.startTime);
        const end = apt.endTime instanceof Date ? apt.endTime : new Date(apt.endTime);

        return {
          id: apt.id,
          title: apt.customerName || "",
          start,
          end,
          appointment: apt,
        };
      }).filter((event) => !isNaN(event.start.getTime()) && !isNaN(event.end.getTime()));
    }

    if (!resources) return [];

    const validResourceIds = new Set<string>();
    resources.forEach((resource) => {
      validResourceIds.add(String(resource.id));
    });

    return appointments
      .filter((apt) => {
        const aptBarberIdStr = String(apt.barberId);
        return validResourceIds.has(aptBarberIdStr);
      })
      .map((apt) => {
        const start = apt.startTime instanceof Date ? apt.startTime : new Date(apt.startTime);
        const end = apt.endTime instanceof Date ? apt.endTime : new Date(apt.endTime);

        return {
          id: apt.id,
          title: apt.customerName || "",
          start,
          end,
          resourceId: String(apt.barberId),
          appointment: apt,
        };
      })
      .filter((event) => {
        if (isNaN(event.start.getTime()) || isNaN(event.end.getTime())) {
          return false;
        }
        return validResourceIds.has(event.resourceId);
      });
  }, [appointments, resources, viewMode]);

  // Calculate time range from visible barbers' working hours
  const weekday = date.getDay();
  const effectiveTimeRange = useMemo(() => {
    const barbersWithWorkingHours = visibleBarbers.filter(b => 
      b.workingHours && b.workingHours.weekday === weekday
    );
    
    if (barbersWithWorkingHours.length === 0) {
      return timeRange;
    }
    
    let earliestStart = "23:59";
    let latestEnd = "00:00";
    
    barbersWithWorkingHours.forEach(barber => {
      if (barber.workingHours) {
        if (barber.workingHours.startTime < earliestStart) {
          earliestStart = barber.workingHours.startTime;
        }
        if (barber.workingHours.endTime > latestEnd) {
          latestEnd = barber.workingHours.endTime;
        }
      }
    });
    
    return {
      start: earliestStart,
      end: latestEnd,
    };
  }, [visibleBarbers, weekday, timeRange]);
  
  const [startHour, startMinute] = effectiveTimeRange.start.split(":").map(Number);
  const [endHour, endMinute] = effectiveTimeRange.end.split(":").map(Number);
  const workingStartMinutes = startHour * 60 + startMinute;
  const workingEndMinutes = endHour * 60 + endMinute;
  
  // Calculate min/max time for calendar display
  const minTime = useMemo(() => {
    const dayStart = startOfDay(date);
    return setMinutes(setHours(dayStart, startHour), startMinute);
  }, [date, startHour, startMinute]);
  
  const maxTime = useMemo(() => {
    const dayStart = startOfDay(date);
    return setMinutes(setHours(dayStart, endHour), endMinute);
  }, [date, endHour, endMinute]);

  // Calculate scroll position to show start of working hours at the top on initial load
  const scrollToTime = useMemo(() => {
    return minTime; // Use minTime which represents the start of working hours
  }, [minTime]);

  // Ref for calendar container to manually scroll
  const calendarRef = useRef<HTMLDivElement>(null);

  // Scroll to start of working hours on mount and when date changes
  useEffect(() => {
    if (viewMode !== "day") return;
    
    const scrollToStart = () => {
      // Find the time slot elements
      const timeSlots = calendarRef.current?.querySelectorAll('.rbc-time-slot');
      if (timeSlots && timeSlots.length > 0) {
        // Scroll to the first time slot (start of working hours)
        const firstSlot = timeSlots[0];
        
        if (firstSlot) {
          // Scroll the calendar's scroll container
          const scrollContainer = calendarRef.current?.querySelector('.rbc-time-content');
          if (scrollContainer) {
            scrollContainer.scrollTop = 0; // Scroll to top to show first slot
          }
        }
      }
    };

    // Wait for calendar to render
    const timeout = setTimeout(scrollToStart, 100);
    return () => clearTimeout(timeout);
  }, [date, viewMode]);

  const slotPropGetter = useCallback(
    (slotDate: Date) => {
      const minutes = slotDate.getHours() * 60 + slotDate.getMinutes();
      const isWorkingHour = minutes >= workingStartMinutes && minutes < workingEndMinutes;
      return {
        className: isWorkingHour ? "rbc-slot-working" : "rbc-slot-off-hours",
      };
    },
    [workingStartMinutes, workingEndMinutes],
  );

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
    return (
      <div className="w-full h-full flex items-center justify-center bg-white rounded-xl border border-gray-200">
        <div className="text-center p-12">
          <p className="text-gray-900 text-lg font-medium">No barbers selected</p>
        </div>
      </div>
    );
  }

  const dateFnsLocale = locales[locale as keyof typeof locales] || locales.de;
  const step = timeInterval;
  const slotsPerHour = 60 / step;
  const timeslots = Number.isInteger(slotsPerHour) ? slotsPerHour : 1;
  const slotHeightPx = getIntervalHeight(intervalHeight);

  // Keep slot sizing and header height in sync via CSS vars (visual only)
  const calendarStyle = useMemo(() => {
    return {
      ["--rbc-slot-height" as string]: `${slotHeightPx}px`,
      ["--rbc-resource-header-height" as string]: "52px",
      ["--rbc-timeslots-per-hour" as string]: String(timeslots),
    } satisfies CSSProperties;
  }, [slotHeightPx, timeslots]);

  return (
    <div
      ref={calendarRef}
      className="admin-calendar relative w-full h-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
      style={calendarStyle}
    >
      {/* @ts-expect-error - react-big-calendar supports string accessors but types expect functions */}
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
        defaultView={viewMode === "day" ? Views.DAY : Views.WEEK}
        view={viewMode === "day" ? Views.DAY : Views.WEEK}
        views={[Views.DAY, Views.WEEK]}
        defaultDate={date}
        date={date}
        min={minTime}
        max={maxTime}
        scrollToTime={scrollToTime}
        step={step}
        timeslots={timeslots}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        onEventDrop={handleEventDrop}
        onView={handleViewChange}
        onNavigate={handleNavigate}
        selectable
        draggableAccessor={() => true}
        resizable={false}
        popup
        showMultiDayTimes={false}
        components={{
          resourceHeader: ResourceHeader as any,
          event: EventComponent as any,
        }}
        tooltipAccessor={() => ""}
        culture={locale}
        toolbar={false}
        slotPropGetter={slotPropGetter}
        formats={{
          dayFormat: (date: Date) => format(date, "EEE d", { locale: dateFnsLocale }),
          dayHeaderFormat: (date: Date) => {
            if (viewMode === "week") {
              return format(date, "EEE d MMM", { locale: dateFnsLocale });
            }
            return format(date, "EEEE, MMMM d", { locale: dateFnsLocale });
          },
          dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) => 
            `${format(start, "MMM d", { locale: dateFnsLocale })} - ${format(end, "MMM d, yyyy", { locale: dateFnsLocale })}`,
          weekdayFormat: (date: Date) => format(date, "EEE", { locale: dateFnsLocale }),
          timeGutterFormat: (date: Date) => format(date, "HH:mm"),
          eventTimeRangeFormat: () => null,
          eventTimeRangeStartFormat: () => null,
          eventTimeRangeEndFormat: () => null,
        }}
      />
    </div>
  );
}
