export type AppointmentStatus = "BOOKED" | "ARRIVED" | "MISSED" | "CANCELED" | "COMPLETED";

export interface CalendarSettings {
  selectedBarberIds: string[];
  timeRange: {
    start: string; // "HH:mm" format
    end: string; // "HH:mm" format
  };
  zoomMode: "dynamic" | "custom";
  timeInterval: 15 | 30 | 60; // minutes
  intervalHeight: "small" | "medium" | "large";
}

export interface AppointmentDisplayData {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string;
  barberId: string;
  barberName: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  totalPrice: number;
  notes: string | null;
  services: Array<{
    id: string;
    serviceId: number;
    serviceName: string;
    price: number;
  }>;
}

export interface BarberDisplayData {
  id: string;
  displayName: string;
  workingHours: {
    startTime: string; // "HH:mm"
    endTime: string; // "HH:mm"
    weekday: number;
  } | null;
  avatar?: string;
}

export interface TimeSlotConfig {
  startTime: Date;
  endTime: Date;
  intervalMinutes: number;
}

export interface AppointmentPosition {
  appointment: AppointmentDisplayData;
  startRow: number;
  endRow: number;
  barberColumn: number;
  dayColumn?: number; // For week view: 0 = Monday, 6 = Sunday
}

