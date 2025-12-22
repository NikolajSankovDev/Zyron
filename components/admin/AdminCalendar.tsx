"use client";

import { useMemo, useCallback, useEffect, useLayoutEffect, useState } from "react";
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

  // Calculate duration in minutes
  const durationMinutes = Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 60));
  
  // Determine if this is a short appointment (15 minutes or less)
  const isShortAppointment = durationMinutes <= 15;

  const eventRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    
    // Wait for layout to settle
    setTimeout(() => {
      const rbcEvent = node.closest('.rbc-event') as HTMLElement;
      if (!rbcEvent) return;
      
      const eventHeight = rbcEvent.offsetHeight;
      
      // Force apply correct padding and overflow based on event height
      // For 60min intervals, events are ~39px tall (6.25%)
      if (eventHeight <= 45) {
        // Small events - use minimal padding
        node.style.setProperty('padding', '2px 4px 2px 8px', 'important');
        node.style.setProperty('gap', '0px', 'important');
      } else {
        // Larger events - can use more padding
        node.style.setProperty('padding', '4px 6px 4px 10px', 'important');
        node.style.setProperty('gap', '1px', 'important');
      }
      
      // Always set overflow to visible
      node.style.setProperty('overflow', 'visible', 'important');
    }, 100);
  }, []);

  return (
    <div
      ref={eventRef}
      className={`calendar-event ${isShortAppointment ? 'calendar-event--short' : ''}`}
      style={{
        borderTop: "1px solid rgba(0, 0, 0, 0.25)",
        borderRight: "1px solid rgba(0, 0, 0, 0.25)",
        borderBottom: "1px solid rgba(0, 0, 0, 0.25)",
        borderLeft: `3px solid ${statusColors.border}`,
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
  
  // Calculate duration in minutes
  const durationMinutes = Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 60));
  const isShortAppointment = durationMinutes <= 15;

  return {
    className: `calendar-event-wrapper calendar-event-wrapper--${appointment.status.toLowerCase()} ${isShortAppointment ? 'calendar-event-wrapper--short' : ''}`,
    style: {
      backgroundColor: statusColors.bg,
      borderColor: statusColors.border,
      color: statusColors.text,
      // For short appointments, set a max-width to allow side-by-side layout
      ...(isShortAppointment && {
        maxWidth: 'calc(50% - 2px)',
        minWidth: '80px',
      }),
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
  const [isScrollReady, setIsScrollReady] = useState(false);

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

  // Scroll to top when view changes - use useLayoutEffect to prevent visible scroll jump
  useLayoutEffect(() => {
    const scrollToTop = () => {
      // Find all possible scrollable containers in react-big-calendar
      const timeContent = document.querySelector('.admin-calendar .rbc-time-content');
      const scrollContainer = document.querySelector('.admin-calendar .rbc-time-content > div');
      
      // Scroll all found containers to top
      [timeContent, scrollContainer].forEach((element) => {
        if (element) {
          (element as HTMLElement).scrollTop = 0;
        }
      });
    };

    // Scroll immediately (synchronously before paint)
    scrollToTop();
  }, [viewMode]);

  // Aggressively reset scroll during initial render and only show calendar when scroll is confirmed at top
  useEffect(() => {
    setIsScrollReady(false);
    let frameCount = 0;
    const maxFrames = 15; // Check for 15 frames to ensure scroll stays at 0
    let rafId: number | null = null;
    let consecutiveZeros = 0;
    const requiredZeros = 3; // Need 3 consecutive frames with scroll at 0
    let hasSetScrollReady = false; // Track if we've set isScrollReady to true in this effect run

    const scrollToTop = () => {
      const timeContent = document.querySelector('.admin-calendar .rbc-time-content');
      const scrollContainer = document.querySelector('.admin-calendar .rbc-time-content > div');
      
      [timeContent, scrollContainer].forEach((element) => {
        if (element) {
          (element as HTMLElement).scrollTop = 0;
        }
      });
    };

    const checkScrollPosition = () => {
      const timeContent = document.querySelector('.admin-calendar .rbc-time-content');
      const scrollContainer = document.querySelector('.admin-calendar .rbc-time-content > div');
      
      let allAtTop = true;
      [timeContent, scrollContainer].forEach((element) => {
        if (element && (element as HTMLElement).scrollTop !== 0) {
          allAtTop = false;
          (element as HTMLElement).scrollTop = 0;
        }
      });

      if (allAtTop) {
        consecutiveZeros++;
        if (consecutiveZeros >= requiredZeros && !hasSetScrollReady) {
          hasSetScrollReady = true;
          setIsScrollReady(true);
          return;
        }
      } else {
        consecutiveZeros = 0;
      }

      frameCount++;
      if (frameCount < maxFrames) {
        rafId = requestAnimationFrame(checkScrollPosition);
      } else if (!hasSetScrollReady) {
        // If we've checked enough frames, show it anyway
        hasSetScrollReady = true;
        setIsScrollReady(true);
      }
    };

    // Start checking
    scrollToTop();
    rafId = requestAnimationFrame(checkScrollPosition);

    // Also watch for DOM mutations and reset scroll
    const calendarElement = document.querySelector('.admin-calendar');
    if (calendarElement) {
      const observer = new MutationObserver(() => {
        // Reset when DOM changes (but don't reset hasSetScrollReady - we want to show calendar once it's ready)
        frameCount = 0;
        consecutiveZeros = 0;
        scrollToTop();
        if (rafId === null && !hasSetScrollReady) {
          rafId = requestAnimationFrame(checkScrollPosition);
        }
      });

      observer.observe(calendarElement, {
        childList: true,
        subtree: true,
      });

      return () => {
        observer.disconnect();
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
      };
    }

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [viewMode]);

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

  // Apply blue focus box via JavaScript to ensure it's visible
  useEffect(() => {
    const applyFocusBox = () => {
      const events = document.querySelectorAll('.admin-calendar .rbc-event');
      events.forEach((eventEl) => {
        const el = eventEl as HTMLElement;
        const isFocused = el === document.activeElement || el.matches(':focus');
        
        if (isFocused) {
          // Remove outline and apply box-shadow directly
          el.style.setProperty('outline', 'none', 'important');
          el.style.setProperty('box-shadow', '0 0 0 2px #3B82F6', 'important');
          el.style.setProperty('overflow', 'visible', 'important');
          el.style.setProperty('z-index', '10', 'important');
          el.style.setProperty('position', 'relative', 'important');
        } else {
          // Reset when not focused
          el.style.removeProperty('box-shadow');
          el.style.removeProperty('overflow');
          el.style.removeProperty('z-index');
          el.style.removeProperty('position');
        }
      });
    };
    
    // Run on mount and periodically
    applyFocusBox();
    const interval = setInterval(applyFocusBox, 100);
    
    // Listen for focus events
    const handleFocus = () => {
      setTimeout(() => applyFocusBox(), 50);
    };
    const calendar = document.querySelector('.admin-calendar');
    if (calendar) {
      calendar.addEventListener('focusin', handleFocus);
      calendar.addEventListener('focusout', handleFocus);
      calendar.addEventListener('click', handleFocus);
    }
    
    return () => {
      clearInterval(interval);
      if (calendar) {
        calendar.removeEventListener('focusin', handleFocus);
        calendar.removeEventListener('focusout', handleFocus);
        calendar.removeEventListener('click', handleFocus);
      }
    };
  }, [viewMode, date, appointments]);

  // Handle overlapping short appointments - ensure they're positioned side-by-side
  useEffect(() => {
    const adjustOverlappingShortEvents = () => {
      // Find all day slots
      const daySlots = document.querySelectorAll('.admin-calendar .rbc-day-slot');
      
      daySlots.forEach((daySlot) => {
        const eventsContainer = daySlot.querySelector('.rbc-events-container');
        if (!eventsContainer) return;
        
        const allEvents = Array.from(eventsContainer.querySelectorAll('.rbc-event')) as HTMLElement[];
        
        // Apply correct padding and overflow to all events
        allEvents.forEach((rbcEvent) => {
          const eventHeight = rbcEvent.offsetHeight;
          const calendarEvent = rbcEvent.querySelector('.calendar-event') as HTMLElement;
          
          if (calendarEvent) {
            if (eventHeight <= 45) {
              calendarEvent.style.setProperty('padding', '2px 4px 2px 8px', 'important');
              calendarEvent.style.setProperty('gap', '0px', 'important');
            } else {
              calendarEvent.style.setProperty('padding', '4px 6px 4px 10px', 'important');
              calendarEvent.style.setProperty('gap', '1px', 'important');
            }
            calendarEvent.style.setProperty('overflow', 'visible', 'important');
          }
        });
        
        const shortEvents = Array.from(eventsContainer.querySelectorAll('.rbc-event.calendar-event-wrapper--short')) as HTMLElement[];
        
        if (shortEvents.length <= 1) return;
        
        // Group events by their top position (same time slot)
        const eventsByTop = new Map<number, HTMLElement[]>();
        shortEvents.forEach((event) => {
          const top = Math.round(event.offsetTop);
          if (!eventsByTop.has(top)) {
            eventsByTop.set(top, []);
          }
          eventsByTop.get(top)!.push(event);
        });
        
        // For each group of overlapping events, adjust their width
        eventsByTop.forEach((events) => {
          if (events.length > 1) {
            const widthPercent = Math.floor(100 / events.length);
            events.forEach((event) => {
              // Only adjust if react-big-calendar hasn't set a specific width
              const currentWidth = event.style.width;
              if (!currentWidth || currentWidth === '100%') {
                event.style.width = `calc(${widthPercent}% - 2px)`;
                event.style.maxWidth = `calc(${widthPercent}% - 2px)`;
              }
            });
          }
        });
      });
    };
    
    // Run after a short delay to ensure react-big-calendar has positioned events
    const timeout = setTimeout(adjustOverlappingShortEvents, 100);
    
    // Also run when events change
    const observer = new MutationObserver(() => {
      setTimeout(adjustOverlappingShortEvents, 50);
    });
    
    const calendar = document.querySelector('.admin-calendar');
    if (calendar) {
      observer.observe(calendar, {
        childList: true,
        subtree: true,
      });
    }
    
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [viewMode, date, appointments, timeInterval]);

  // Apply inline style fix for time labels to ensure they're visible
  useEffect(() => {
    const applyTimeLabelFix = () => {
      const timeLabels = document.querySelectorAll('.admin-calendar .rbc-time-gutter .rbc-label');
      timeLabels.forEach((label) => {
        const el = label as HTMLElement;
        // Apply dark color inline to ensure visibility
        el.style.setProperty('color', '#1f2937', 'important');
      });
    };
    
    // Run after delays to ensure DOM is ready
    const timeouts = [200, 500, 1000].map(delay => setTimeout(applyTimeLabelFix, delay));
    return () => timeouts.forEach(clearTimeout);
  }, [viewMode, date, timeInterval]);

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
    <div className="admin-calendar" style={{ height: '100%', opacity: isScrollReady ? 1 : 0, transition: 'opacity 0.1s' }}>
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
