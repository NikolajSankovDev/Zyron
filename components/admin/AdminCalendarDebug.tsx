"use client";

import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { de, enUS, ru } from "date-fns/locale";
import type { AppointmentDisplayData, BarberDisplayData } from "@/lib/types/admin-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { de, en: enUS, ru };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface DebugProps {
  date: Date;
  barbers: BarberDisplayData[];
  appointments: AppointmentDisplayData[];
}

export function AdminCalendarDebug({ date, barbers, appointments }: DebugProps) {
  const resources = barbers.map((b) => ({
    id: String(b.id),
    title: b.displayName,
  }));

  const events = appointments.map((apt) => {
    const start = apt.startTime instanceof Date ? apt.startTime : new Date(apt.startTime);
    const end = apt.endTime instanceof Date ? apt.endTime : new Date(apt.endTime);
    
    return {
      id: apt.id,
      title: apt.customerName,
      start,
      end,
      resourceId: String(apt.barberId),
    };
  });

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('[DEBUG Calendar] Resources:', resources);
    console.log('[DEBUG Calendar] Events:', events.map(e => ({
      id: e.id,
      title: e.title,
      resourceId: e.resourceId,
      start: e.start.toISOString(),
      end: e.end.toISOString(),
    })));
  }

  return (
    <div style={{ 
      height: "100%", 
      width: "100%", 
      background: "white", 
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }}>
      <div style={{ 
        padding: "16px", 
        borderBottom: "1px solid #e5e7eb",
        background: "#f9fafb"
      }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: "16px", 
          fontWeight: "bold",
          color: "#111827"
        }}>
          🔍 DEBUG Calendar - Simple Version (No Custom Styling)
        </h2>
        <p style={{ 
          margin: "4px 0 0 0", 
          fontSize: "12px", 
          color: "#6b7280"
        }}>
          Resources: {resources.length} | Events: {events.length}
        </p>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <Calendar
          localizer={localizer}
          date={date}
          defaultDate={date}
          defaultView={Views.DAY}
          view={Views.DAY}
          views={[Views.DAY]}
          events={events}
          resources={resources}
          resourceIdAccessor="id"
          resourceTitleAccessor="title"
          resourceAccessor="resourceId"
          startAccessor="start"
          endAccessor="end"
          step={15}
          timeslots={1}
        />
      </div>
    </div>
  );
}

