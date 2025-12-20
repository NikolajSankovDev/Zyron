"use client";

import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isSameDay, addDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "next-intl";
import { de, enUS, ru } from "date-fns/locale";

const locales = { de, en: enUS, ru };

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export function MiniCalendar({ selectedDate, onDateSelect }: MiniCalendarProps) {
  let locale = 'de';
  try {
    locale = useLocale();
  } catch (e) {
    // Fallback to 'de' if intl context is not available
  }
  const dateFnsLocale = locales[locale as keyof typeof locales] || locales.de;
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));

  useEffect(() => {
    setCurrentMonth(startOfMonth(selectedDate));
  }, [selectedDate]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1, locale: dateFnsLocale });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1, locale: dateFnsLocale });

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = new Date(day);
    day.setDate(day.getDate() + 1);
  }

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1, locale: dateFnsLocale });
  const weekDays = Array.from({ length: 7 }).map((_, index) =>
    format(addDays(weekStart, index), "EEEEE", { locale: dateFnsLocale })
  );

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    onDateSelect(date);
  };

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-3 text-white">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-300 hover:bg-gray-800"
          onClick={handlePreviousMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-semibold">
          {format(currentMonth, "MMM yyyy", { locale: dateFnsLocale })}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-300 hover:bg-gray-800"
          onClick={handleNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] uppercase text-gray-400">
        {weekDays.map((dayLabel, index) => (
          <span key={index}>{dayLabel}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          let dayClasses = "text-gray-300 hover:bg-gray-800";
          if (!isCurrentMonth) {
            dayClasses = "text-gray-600 hover:bg-gray-800/60";
          }
          if (isToday) {
            dayClasses += " border border-gray-600";
          }
          if (isSelected) {
            dayClasses = "bg-white text-black hover:bg-white";
          }

          return (
            <button
              key={index}
              onClick={() => handleDateClick(day)}
              className={`flex h-8 items-center justify-center rounded-md text-sm transition ${dayClasses}`}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
