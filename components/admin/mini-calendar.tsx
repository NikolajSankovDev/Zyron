"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isSameDay, getDay } from "date-fns";
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
  const locale = useLocale();
  const dateFnsLocale = locales[locale as keyof typeof locales] || locales.de;
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = new Date(day);
    day.setDate(day.getDate() + 1);
  }

  const weekDays = ["M", "D", "M", "D", "F", "S", "S"];

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
    <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreviousMonth}
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700/50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-semibold text-white">
          {format(currentMonth, "MMM", { locale: dateFnsLocale }).toUpperCase()}
        </div>
        <div className="text-sm text-gray-400">
          {format(currentMonth, "yyyy")}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-700/50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="text-center text-xs text-gray-500 font-medium py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={index}
              onClick={() => handleDateClick(day)}
              className={`
                h-9 w-9 text-xs rounded transition-colors font-medium
                ${!isCurrentMonth ? "text-gray-600" : "text-gray-300"}
                ${isSelected 
                  ? "bg-primary text-white font-semibold" 
                  : isToday 
                    ? "bg-gray-700/50 text-white font-semibold" 
                    : "hover:bg-gray-700/50 hover:text-white"
                }
              `}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

