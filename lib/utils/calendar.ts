import { addMinutes, format, startOfDay, setHours, setMinutes, isSameDay, differenceInMinutes, addDays, startOfWeek } from "date-fns";
import type { CalendarSettings, AppointmentDisplayData, TimeSlotConfig, AppointmentPosition } from "@/lib/types/admin-calendar";

/**
 * Generate time slots based on settings
 * For week view, generates slots for all 7 days of the week
 */
export function generateTimeSlots(
  date: Date,
  settings: CalendarSettings,
  viewMode: "day" | "week" = "day"
): Date[] {
  const slots: Date[] = [];
  const [startHour, startMinute] = settings.timeRange.start.split(":").map(Number);
  const [endHour, endMinute] = settings.timeRange.end.split(":").map(Number);

  if (viewMode === "week") {
    // Generate slots for all 7 days of the week
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const dayDate = addDays(weekStart, dayOffset);
      const startTime = setMinutes(setHours(startOfDay(dayDate), startHour), startMinute);
      const endTime = setMinutes(setHours(startOfDay(dayDate), endHour), endMinute);

      let currentTime = new Date(startTime);
      while (currentTime < endTime) {
        slots.push(new Date(currentTime));
        currentTime = addMinutes(currentTime, settings.timeInterval);
      }
    }
  } else {
    // Day view - single day
    const startTime = setMinutes(setHours(startOfDay(date), startHour), startMinute);
    const endTime = setMinutes(setHours(startOfDay(date), endHour), endMinute);

    let currentTime = new Date(startTime);
    while (currentTime < endTime) {
      slots.push(new Date(currentTime));
      currentTime = addMinutes(currentTime, settings.timeInterval);
    }
  }

  return slots;
}

/**
 * Calculate appointment position in grid
 * For week view, also calculates the day column index
 */
export function calculateAppointmentPosition(
  appointment: AppointmentDisplayData,
  timeSlots: Date[],
  barberIndex: number,
  viewMode: "day" | "week" = "day",
  weekStartDate?: Date
): AppointmentPosition | null {
  if (timeSlots.length === 0) return null;

  const appointmentStart = new Date(appointment.startTime);
  const appointmentEnd = new Date(appointment.endTime);
  const appointmentDay = startOfDay(appointmentStart);

  // For week view, calculate day column
  let dayColumn = 0;
  if (viewMode === "week" && weekStartDate) {
    const weekStart = startOfWeek(weekStartDate, { weekStartsOn: 1 });
    const dayDiff = Math.floor((appointmentDay.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
    if (dayDiff < 0 || dayDiff > 6) {
      return null; // Appointment is outside the week range
    }
    dayColumn = dayDiff;
  }

  // Calculate slots per day for week view
  const slotsPerDay = viewMode === "week" 
    ? Math.floor(timeSlots.length / 7)
    : timeSlots.length;

  // Find the row index within the day where appointment starts
  const dayStartSlotIndex = dayColumn * slotsPerDay;
  const dayEndSlotIndex = dayStartSlotIndex + slotsPerDay;
  const daySlots = timeSlots.slice(dayStartSlotIndex, dayEndSlotIndex);

  let startRow = -1;
  for (let i = 0; i < daySlots.length; i++) {
    const slotTime = new Date(daySlots[i]);
    if (slotTime.getTime() >= appointmentStart.getTime()) {
      startRow = dayStartSlotIndex + i;
      break;
    }
  }

  // If appointment starts before first slot of the day, check if it overlaps
  if (startRow === -1) {
    if (daySlots.length > 0 && appointmentEnd.getTime() > daySlots[0].getTime()) {
      startRow = dayStartSlotIndex; // Appointment started before but extends into visible range
    } else {
      return null; // Appointment is completely before visible range for this day
    }
  }

  // Find the row index where appointment ends
  let endRow = startRow;
  for (let i = startRow - dayStartSlotIndex; i < daySlots.length; i++) {
    const slotTime = new Date(daySlots[i]);
    if (slotTime.getTime() >= appointmentEnd.getTime()) {
      endRow = dayStartSlotIndex + i;
      break;
    }
  }

  // If appointment extends beyond last slot of the day
  if (endRow === startRow && appointmentEnd.getTime() > daySlots[daySlots.length - 1].getTime()) {
    endRow = dayEndSlotIndex - 1;
  }

  // Calculate duration in minutes
  const durationMinutes = differenceInMinutes(appointmentEnd, appointmentStart);
  
  // Calculate interval between slots in minutes
  const intervalMinutes = timeSlots.length > 1
    ? differenceInMinutes(timeSlots[1], timeSlots[0])
    : 30;

  // Calculate how many rows to span
  const rowsToSpan = Math.max(1, Math.ceil(durationMinutes / intervalMinutes));

  return {
    appointment,
    startRow,
    endRow: Math.min(startRow + rowsToSpan - 1, dayEndSlotIndex - 1),
    barberColumn: barberIndex,
    dayColumn: viewMode === "week" ? dayColumn : undefined,
  };
}

/**
 * Get current time indicator position
 */
export function getCurrentTimePosition(
  timeSlots: Date[],
  currentDate: Date
): number | null {
  if (!isSameDay(currentDate, new Date())) {
    return null; // Only show current time for today
  }

  const now = new Date();
  for (let i = 0; i < timeSlots.length; i++) {
    const slotTime = new Date(timeSlots[i]);
    if (slotTime.getTime() > now.getTime()) {
      // Current time is between previous slot and this one
      return i - 0.5;
    }
  }

  return null;
}

/**
 * Calculate daily cashing up total
 */
export function calculateDailyTotal(appointments: AppointmentDisplayData[]): number {
  return appointments.reduce((total, apt) => {
    // Count all appointments (not just completed/arrived) for cashing up
    return total + apt.totalPrice;
  }, 0);
}

/**
 * Get default calendar settings
 */
export function getDefaultCalendarSettings(barbers?: Array<{ workingHours: { startTime: string; endTime: string } | null }>): CalendarSettings {
  let defaultTimeRange = {
    start: "08:00",
    end: "20:00",
  };

  // Calculate from barbers if provided
  if (barbers && barbers.length > 0) {
    let earliestHour = 23;
    let earliestMinute = 59;
    let latestHour = 0;
    let latestMinute = 0;

    barbers.forEach((barber) => {
      if (barber.workingHours) {
        const [startHour, startMinute] = barber.workingHours.startTime.split(":").map(Number);
        const [endHour, endMinute] = barber.workingHours.endTime.split(":").map(Number);

        if (startHour < earliestHour || (startHour === earliestHour && startMinute < earliestMinute)) {
          earliestHour = startHour;
          earliestMinute = startMinute;
        }

        if (endHour > latestHour || (endHour === latestHour && endMinute > latestMinute)) {
          latestHour = endHour;
          latestMinute = endMinute;
        }
      }
    });

    if (earliestHour < 23) {
      defaultTimeRange = {
        start: `${earliestHour.toString().padStart(2, "0")}:${earliestMinute.toString().padStart(2, "0")}`,
        end: `${latestHour.toString().padStart(2, "0")}:${latestMinute.toString().padStart(2, "0")}`,
      };
    }
  }

  return {
    selectedBarberIds: [],
    timeRange: defaultTimeRange,
    zoomMode: "dynamic",
    timeInterval: 30,
    intervalHeight: "small",
  };
}

/**
 * Load calendar settings from localStorage
 */
export function loadCalendarSettings(barbers?: Array<{ workingHours: { startTime: string; endTime: string } | null }>): CalendarSettings {
  if (typeof window === "undefined") {
    return getDefaultCalendarSettings(barbers);
  }

  try {
    const stored = localStorage.getItem("admin-calendar-settings");
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...getDefaultCalendarSettings(barbers), ...parsed };
    }
  } catch (error) {
    console.error("Failed to load calendar settings:", error);
  }

  return getDefaultCalendarSettings(barbers);
}

/**
 * Save calendar settings to localStorage
 */
export function saveCalendarSettings(settings: CalendarSettings): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem("admin-calendar-settings", JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save calendar settings:", error);
  }
}

/**
 * Format time for display
 */
export function formatTime(date: Date): string {
  return format(date, "HH:mm");
}

/**
 * Format date for display
 */
export function formatDate(date: Date, locale: string = "en"): string {
  try {
    const localeModule = require(`date-fns/locale/${locale}`);
    return format(date, "EEEE, do MMMM yyyy", { locale: localeModule.default || localeModule });
  } catch {
    return format(date, "EEEE, do MMMM yyyy");
  }
}

/**
 * Get interval height in pixels
 */
export function getIntervalHeight(height: "small" | "medium" | "large"): number {
  switch (height) {
    case "small":
      return 28;
    case "medium":
      return 40;
    case "large":
      return 55;
    default:
      return 28;
  }
}

