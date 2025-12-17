"use client";

import { MiniCalendar } from "./mini-calendar";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export function SidebarMiniCalendarWrapper() {
  const pathname = usePathname();
  // Check if pathname ends with /admin/calendar (handles locale-prefixed paths)
  const isCalendarPage = pathname.endsWith("/admin/calendar") || pathname === "/admin/calendar";
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Listen for date changes from the calendar
  useEffect(() => {
    const handleDateChange = (event: CustomEvent) => {
      setSelectedDate(new Date(event.detail));
    };

    window.addEventListener("calendar-date-change" as any, handleDateChange);
    return () => {
      window.removeEventListener("calendar-date-change" as any, handleDateChange);
    };
  }, []);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Dispatch event to update calendar
    window.dispatchEvent(
      new CustomEvent("mini-calendar-date-select", { detail: date })
    );
  };

  if (!isCalendarPage) {
    return null;
  }

  return (
    <div className="px-6 pb-6">
      <MiniCalendar selectedDate={selectedDate} onDateSelect={handleDateSelect} />
    </div>
  );
}

