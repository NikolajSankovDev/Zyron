"use client";

import { useMemo, useCallback, useEffect, useRef } from "react";
import { Calendar, dateFnsLocalizer, SlotInfo, View, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek as dateFnsStartOfWeek, getDay, setHours, setMinutes, startOfDay } from "date-fns";
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

  // Transform barbers to resources (only for day view with resources)
  const resources = useMemo(() => {
    if (viewMode !== "day") return undefined;
    return visibleBarbers.map((barber) => ({
      id: String(barber.id),
      title: barber.displayName,
      barber,
    }));
  }, [visibleBarbers, viewMode]);

  // Simple Resource header - just show title (barber name)
  const ResourceHeader = useCallback(({ resource }: { resource: any }) => {
    const displayName = resource.title;
    return (
      <div className="text-center py-2 text-sm font-semibold text-gray-900">
        {displayName}
      </div>
    );
  }, []);

  // Event component - renders appointment cards
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

    // Determine status
    const isCompleted = appointment.status === "COMPLETED";
    const isMissed = appointment.status === "MISSED";
    const isCanceled = appointment.status === "CANCELED";

    // Determine status class
    let statusClass = "status-booked";
    if (isCompleted) statusClass = "status-completed";
    else if (isMissed) statusClass = "status-missed";
    else if (isCanceled) statusClass = "status-canceled";

    return (
      <div className={`rbc-event-card ${statusClass}`}>
        <div className="rbc-event-time">
          {displayStartTime} - {displayEndTime}
        </div>
        <div className="rbc-event-customer">
          {appointment.customerName}
        </div>
        <div className="rbc-event-service-name">
          {serviceName}
        </div>
      </div>
    );
  }, []);

  // Transform appointments to events
  const events = useMemo(() => {
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
  }, [appointments, resources]);

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
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center p-12">
          <p className="text-gray-400 text-lg font-medium">No barbers selected</p>
        </div>
      </div>
    );
  }

  const dateFnsLocale = locales[locale as keyof typeof locales] || locales.de;
  const step = timeInterval;

  return (
    <div ref={calendarRef} className="w-full h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* @ts-expect-error - react-big-calendar supports string accessors but types expect functions */}
      <DragAndDropCalendar
        localizer={localizer}
        events={events}
        resources={resources}
        resourceIdAccessor="id"
        resourceTitleAccessor="title"
        resourceAccessor="resourceId"
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        defaultView={viewMode === "day" ? Views.DAY : viewMap[viewMode]}
        view={viewMode === "day" ? Views.DAY : viewMap[viewMode]}
        views={[Views.DAY, Views.WEEK]}
        defaultDate={date}
        date={date}
        min={minTime}
        max={maxTime}
        scrollToTime={scrollToTime}
        step={step}
        timeslots={1}
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
