import { safePrismaQuery, prisma } from "@/lib/prisma";
import { addMinutes, isBefore, isAfter, setHours, setMinutes, startOfDay, isSameDay, getDay, format } from "date-fns";

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

/**
 * Check if a time slot overlaps with the lunch break (14:30 - 15:00)
 * A slot overlaps if it starts at or after 14:30 and before 15:00, OR
 * if it starts before 14:30 but ends after 14:30
 * @param slotStart - Start time of the slot
 * @param slotEnd - End time of the slot
 * @returns true if slot overlaps with lunch break
 */
function overlapsWithLunchBreak(slotStart: Date, slotEnd: Date): boolean {
  try {
    // Create lunch break boundaries for the same day
    const lunchBreakStart = new Date(slotStart);
    lunchBreakStart.setHours(14, 30, 0, 0);
    
    const lunchBreakEnd = new Date(slotStart);
    lunchBreakEnd.setHours(15, 0, 0, 0);
    
    const slotStartTime = slotStart.getTime();
    const slotEndTime = slotEnd.getTime();
    const breakStartTime = lunchBreakStart.getTime();
    const breakEndTime = lunchBreakEnd.getTime();
    
    // Slot overlaps if:
    // 1. It starts during the break (14:30 <= start < 15:00), OR
    // 2. It starts before 14:30 but ends after 14:30 (and before or at 15:00)
    // We want to allow slots that end exactly at 14:30 (like 14:15-14:30)
    // So we check: slot starts before 15:00 AND slot ends after 14:30
    // But we exclude slots that end exactly at 14:30
    return slotStartTime < breakEndTime && slotEndTime > breakStartTime;
  } catch (error) {
    console.error("Error checking lunch break overlap:", error);
    return false; // Default to no overlap on error
  }
}

/**
 * Generate available time slots for a barber on a specific date
 * @param barberId - The barber's ID
 * @param date - The date to generate slots for
 * @param durationMinutes - Total duration needed for the appointment
 * @param intervalMinutes - Slot interval (default: 15)
 * @returns Array of available time slots
 */
export async function generateAvailableSlots(
  barberId: string,
  date: Date,
  durationMinutes: number,
  intervalMinutes: number = 15
): Promise<TimeSlot[]> {
  // Get barber's working hours for the weekday
  const weekday = date.getDay();
  
  const workingHours = await safePrismaQuery(
    async () => {
      if (!prisma) return null;
      return await prisma.barberWorkingHours.findUnique({
        where: {
          barberId_weekday: {
            barberId,
            weekday,
          },
        },
      });
    },
    null
  );

  if (!workingHours) {
    return []; // No working hours for this day
  }

  // Parse working hours
  const [startHour, startMinute] = workingHours.startTime.split(":").map(Number);
  const [endHour, endMinute] = workingHours.endTime.split(":").map(Number);

  const dayStart = setMinutes(setHours(date, startHour), startMinute);
  const dayEnd = setMinutes(setHours(date, endHour), endMinute);

  // Get existing appointments for this barber on this date
  const dayStartDate = new Date(date);
  dayStartDate.setHours(0, 0, 0, 0);
  const dayEndDate = new Date(date);
  dayEndDate.setHours(23, 59, 59, 999);

  const existingAppointments = await safePrismaQuery(
    async () => {
      if (!prisma) return [];
      return await prisma.appointment.findMany({
        where: {
          barberId,
          startTime: {
            gte: dayStartDate,
            lte: dayEndDate,
          },
          status: {
            not: "CANCELED",
          },
        },
      });
    },
    []
  );

  // Get time off periods for this barber
  const timeOffs = await safePrismaQuery(
    async () => {
      if (!prisma) return [];
      return await prisma.barberTimeOff.findMany({
        where: {
          barberId,
          startDateTime: {
            lte: dayEndDate,
          },
          endDateTime: {
            gte: dayStartDate,
          },
        },
      });
    },
    []
  );

  // Generate all possible slots
  const slots: TimeSlot[] = [];
  let currentSlotStart = dayStart;

  // Define lunch break boundaries
  const lunchBreakStart = new Date(dayStart);
  lunchBreakStart.setHours(14, 30, 0, 0);
  const lunchBreakEnd = new Date(dayStart);
  lunchBreakEnd.setHours(15, 0, 0, 0);

  // Generate slots in 15-minute intervals until dayEnd
  // We use intervalMinutes (15) for slot generation, not service duration
  // This ensures all time slots are shown regardless of service length
  while (isBefore(currentSlotStart, dayEnd)) {
    // For display purposes, use interval (15 min) to check if slot fits
    // The actual service duration is only used for conflict checking
    const slotDisplayEnd = addMinutes(currentSlotStart, intervalMinutes);
    const currentSlotEnd = addMinutes(currentSlotStart, durationMinutes);

    // Break if even a 15-minute slot wouldn't fit
    if (isAfter(slotDisplayEnd, dayEnd)) {
      break;
    }

    // Skip slots that would start during lunch break (14:30 - 15:00)
    // We want slots up to 14:15, then skip to 15:00
    const slotStartTime = currentSlotStart.getTime();
    const breakStartTime = lunchBreakStart.getTime();
    const breakEndTime = lunchBreakEnd.getTime();
    
    if (slotStartTime >= breakStartTime && slotStartTime < breakEndTime) {
      // Jump to 15:00
      currentSlotStart = new Date(lunchBreakEnd);
      continue;
    }

    // Check if slot is in the past
    const now = new Date();
    const today = startOfDay(now);
    const slotDate = startOfDay(currentSlotStart);
    
    // If slot is on a past day, skip it (but keep slots for today, even if in the past)
    if (isBefore(slotDate, today)) {
      currentSlotStart = addMinutes(currentSlotStart, intervalMinutes);
      continue;
    }

    // Check if slot conflicts with existing appointments
    const hasConflict = existingAppointments.some((apt) => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);
      return (
        (isBefore(currentSlotStart, aptEnd) && isAfter(currentSlotStart, aptStart)) ||
        (isBefore(currentSlotEnd, aptEnd) && isAfter(currentSlotEnd, aptStart)) ||
        (isBefore(aptStart, currentSlotEnd) && isAfter(aptStart, currentSlotStart))
      );
    });

    // Check if slot conflicts with time off
    const hasTimeOff = timeOffs.some((to) => {
      const toStart = new Date(to.startDateTime);
      const toEnd = new Date(to.endDateTime);
      return (
        (isBefore(currentSlotStart, toEnd) && isAfter(currentSlotStart, toStart)) ||
        (isBefore(currentSlotEnd, toEnd) && isAfter(currentSlotEnd, toStart)) ||
        (isBefore(toStart, currentSlotEnd) && isAfter(toStart, currentSlotStart))
      );
    });
    
    // Note: We do NOT check if service duration overlaps with lunch break
    // The lunch break slots (14:30, 14:45) are already skipped above
    // Slots before the break (like 14:00, 14:15) should be available regardless of service duration
    
    // Check if slot is in the past (for today only)
    let isPastSlot = false;
    if (isSameDay(slotDate, today)) {
      // Calculate next 15-minute interval from now
      const currentMinutes = now.getMinutes();
      const currentHours = now.getHours();
      
      // Calculate next quarter hour (round up to next 15-minute mark)
      const nextQuarterMinutes = Math.ceil(currentMinutes / 15) * 15;
      let nextQuarterHour = currentHours;
      let nextQuarterMin = nextQuarterMinutes;
      
      if (nextQuarterMinutes >= 60) {
        nextQuarterHour += 1;
        nextQuarterMin = 0;
      }
      
      // Create next quarter time with seconds and milliseconds set to 0
      // Use native Date methods to ensure seconds and milliseconds are reset
      const nextQuarterTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), nextQuarterHour, nextQuarterMin, 0, 0);
      
      // Mark as past if before next quarter hour
      isPastSlot = isBefore(currentSlotStart, nextQuarterTime);
    }

    slots.push({
      start: new Date(currentSlotStart),
      end: new Date(currentSlotEnd),
      available: !hasConflict && !hasTimeOff && !isPastSlot,
    });

    // Move to next slot
    currentSlotStart = addMinutes(currentSlotStart, intervalMinutes);
  }

  return slots; // Return all slots, not just available ones
}

/**
 * Generate all time slots (available and unavailable) for a barber on a specific date
 * @param barberId - The barber's ID
 * @param date - The date to generate slots for
 * @param durationMinutes - Total duration needed for the appointment
 * @param intervalMinutes - Slot interval (default: 15)
 * @returns Array of all time slots with availability status
 */
export async function generateAllSlots(
  barberId: string,
  date: Date,
  durationMinutes: number,
  intervalMinutes: number = 15
): Promise<TimeSlot[]> {
  // Get barber's working hours for the weekday
  const weekday = date.getDay();
  
  const workingHours = await safePrismaQuery(
    async () => {
      if (!prisma) return null;
      return await prisma.barberWorkingHours.findUnique({
        where: {
          barberId_weekday: {
            barberId,
            weekday,
          },
        },
      });
    },
    null
  );

  if (!workingHours) {
    return []; // No working hours for this day
  }

  // Parse working hours
  const [startHour, startMinute] = workingHours.startTime.split(":").map(Number);
  const [endHour, endMinute] = workingHours.endTime.split(":").map(Number);

  const dayStart = setMinutes(setHours(date, startHour), startMinute);
  const dayEnd = setMinutes(setHours(date, endHour), endMinute);

  // Get existing appointments for this barber on this date
  const dayStartDate = new Date(date);
  dayStartDate.setHours(0, 0, 0, 0);
  const dayEndDate = new Date(date);
  dayEndDate.setHours(23, 59, 59, 999);

  const existingAppointments = await safePrismaQuery(
    async () => {
      if (!prisma) return [];
      return await prisma.appointment.findMany({
        where: {
          barberId,
          startTime: {
            gte: dayStartDate,
            lte: dayEndDate,
          },
          status: {
            not: "CANCELED",
          },
        },
      });
    },
    []
  );

  // Get time off periods for this barber
  const timeOffs = await safePrismaQuery(
    async () => {
      if (!prisma) return [];
      return await prisma.barberTimeOff.findMany({
        where: {
          barberId,
          startDateTime: {
            lte: dayEndDate,
          },
          endDateTime: {
            gte: dayStartDate,
          },
        },
      });
    },
    []
  );

  // Generate all possible slots
  const slots: TimeSlot[] = [];
  let currentSlotStart = dayStart;

  // Define lunch break boundaries
  const lunchBreakStart = new Date(dayStart);
  lunchBreakStart.setHours(14, 30, 0, 0);
  const lunchBreakEnd = new Date(dayStart);
  lunchBreakEnd.setHours(15, 0, 0, 0);

  // Generate slots in 15-minute intervals until dayEnd
  // We use intervalMinutes (15) for slot generation, not service duration
  // This ensures all time slots are shown regardless of service length
  while (isBefore(currentSlotStart, dayEnd)) {
    // For display purposes, use interval (15 min) to check if slot fits
    // The actual service duration is only used for conflict checking
    const slotDisplayEnd = addMinutes(currentSlotStart, intervalMinutes);
    const currentSlotEnd = addMinutes(currentSlotStart, durationMinutes);

    // Break if even a 15-minute slot wouldn't fit
    if (isAfter(slotDisplayEnd, dayEnd)) {
      break;
    }

    // Skip slots that would start during lunch break (14:30 - 15:00)
    // We want slots up to 14:15, then skip to 15:00
    const slotStartTime = currentSlotStart.getTime();
    const breakStartTime = lunchBreakStart.getTime();
    const breakEndTime = lunchBreakEnd.getTime();
    
    if (slotStartTime >= breakStartTime && slotStartTime < breakEndTime) {
      // Jump to 15:00
      currentSlotStart = new Date(lunchBreakEnd);
      continue;
    }

    // Check if slot is in the past
    const now = new Date();
    const today = startOfDay(now);
    const slotDate = startOfDay(currentSlotStart);
    
    // If slot is on a past day, skip it (but keep slots for today, even if in the past)
    if (isBefore(slotDate, today)) {
      currentSlotStart = addMinutes(currentSlotStart, intervalMinutes);
      continue;
    }

    // Check if slot conflicts with existing appointments
    const hasConflict = existingAppointments.some((apt) => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);
      return (
        (isBefore(currentSlotStart, aptEnd) && isAfter(currentSlotStart, aptStart)) ||
        (isBefore(currentSlotEnd, aptEnd) && isAfter(currentSlotEnd, aptStart)) ||
        (isBefore(aptStart, currentSlotEnd) && isAfter(aptStart, currentSlotStart))
      );
    });

    // Check if slot conflicts with time off
    const hasTimeOff = timeOffs.some((to) => {
      const toStart = new Date(to.startDateTime);
      const toEnd = new Date(to.endDateTime);
      return (
        (isBefore(currentSlotStart, toEnd) && isAfter(currentSlotStart, toStart)) ||
        (isBefore(currentSlotEnd, toEnd) && isAfter(currentSlotEnd, toStart)) ||
        (isBefore(toStart, currentSlotEnd) && isAfter(toStart, currentSlotStart))
      );
    });
    
    // Note: We do NOT check if service duration overlaps with lunch break
    // The lunch break slots (14:30, 14:45) are already skipped above
    // Slots before the break (like 14:00, 14:15) should be available regardless of service duration
    
    // Check if slot is in the past (for today only)
    let isPastSlot = false;
    if (isSameDay(slotDate, today)) {
      // Calculate next 15-minute interval from now
      const currentMinutes = now.getMinutes();
      const currentHours = now.getHours();
      
      // Calculate next quarter hour (round up to next 15-minute mark)
      const nextQuarterMinutes = Math.ceil(currentMinutes / 15) * 15;
      let nextQuarterHour = currentHours;
      let nextQuarterMin = nextQuarterMinutes;
      
      if (nextQuarterMinutes >= 60) {
        nextQuarterHour += 1;
        nextQuarterMin = 0;
      }
      
      // Create next quarter time with seconds and milliseconds set to 0
      // Use native Date methods to ensure seconds and milliseconds are reset
      const nextQuarterTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), nextQuarterHour, nextQuarterMin, 0, 0);
      
      // Mark as past if before next quarter hour
      isPastSlot = isBefore(currentSlotStart, nextQuarterTime);
    }

    slots.push({
      start: new Date(currentSlotStart),
      end: new Date(currentSlotEnd),
      available: !hasConflict && !hasTimeOff && !isPastSlot,
    });

    // Move to next slot
    currentSlotStart = addMinutes(currentSlotStart, intervalMinutes);
  }

  return slots; // Return all slots, not just available ones
}

/**
 * Generate available time slots for a service across all barbers on a specific date
 * @param serviceId - The service ID
 * @param date - The date to generate slots for
 * @param durationMinutes - Duration of the service
 * @param intervalMinutes - Slot interval (default: 15)
 * @returns Array of time slots grouped by barber (includes both available and unavailable)
 */
export async function generateAvailableSlotsForService(
  serviceId: number,
  date: Date,
  durationMinutes: number,
  intervalMinutes: number = 15
): Promise<Array<{ barberId: string; slots: TimeSlot[] }>> {
  // Get all active barbers
  const barbers = await safePrismaQuery(
    async () => {
      if (!prisma) return [];
      return await prisma.barber.findMany({
        where: { active: true },
        select: { id: true },
      });
    },
    []
  );

  // Generate slots for each barber (all slots, not just available)
  const results: Array<{ barberId: string; slots: TimeSlot[] }> = [];
  
  for (const barber of barbers) {
    const slots = await generateAllSlots(
      barber.id,
      date,
      durationMinutes,
      intervalMinutes
    );
    if (slots.length > 0) {
      results.push({ barberId: barber.id, slots });
    }
  }

  return results;
}

/**
 * Check availability for a service across all barbers for a date range
 * @param serviceId - The service ID
 * @param startDate - Start date of the range
 * @param endDate - End date of the range
 * @param durationMinutes - Duration of the service
 * @returns Map of date strings to availability status
 */
export async function checkServiceAvailabilityForDateRange(
  serviceId: number,
  startDate: Date,
  endDate: Date,
  durationMinutes: number
): Promise<Map<string, "available" | "booked" | "sunday">> {
  const availability = new Map<string, "available" | "booked" | "sunday">();
  const currentDate = new Date(startDate);
  const today = startOfDay(new Date());

  while (currentDate <= endDate) {
    // Create date in local timezone to avoid timezone issues
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    const localDate = new Date(year, month, day, 12, 0, 0);
    const dateStr = format(localDate, "yyyy-MM-dd");
    const weekday = getDay(localDate);
    const dateOnly = startOfDay(localDate);

    // Only mark dates before today as booked (not today itself)
    if (isBefore(dateOnly, today)) {
      availability.set(dateStr, "booked");
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Sundays are not working days (weekday === 0)
    if (weekday === 0) {
      availability.set(dateStr, "sunday");
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Check if any barber has available slots for this date
    const slots = await generateAvailableSlotsForService(
      serviceId,
      localDate,
      durationMinutes
    );

    // Check if any barber has at least one available slot
    const hasAvailableSlots = slots.some((b) =>
      b.slots.some((slot) => slot.available)
    );

    if (hasAvailableSlots) {
      availability.set(dateStr, "available");
    } else {
      availability.set(dateStr, "booked");
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return availability;
}
