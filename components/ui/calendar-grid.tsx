"use client";

import * as React from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isBefore, startOfDay, setHours, setMinutes } from "date-fns";
import { de, enUS, ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

const locales = { de, en: enUS, ru };

interface CalendarGridProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  availability?: Record<string, "available" | "booked" | "sunday">;
  locale?: string;
  disabled?: (date: Date) => boolean;
}

export function CalendarGrid({
  selectedDate,
  onDateSelect,
  availability = {},
  locale = "de",
  disabled,
}: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const t = useTranslations("booking");

  const dateLocale = locales[locale as keyof typeof locales] || locales.de;
  
  // Russian month format - use nominative case with capital letter (Декабрь)
  const formatMonth = (date: Date, locale: string) => {
    if (locale === "ru") {
      // For Russian, LLLL gives nominative case (декабрь) - capitalize first letter
      const monthYear = format(date, "LLLL yyyy", { locale: dateLocale });
      return monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
    }
    // For other languages, MMMM gives nominative case
    return format(date, "MMMM yyyy", { locale: dateLocale });
  };
  
  // Format weekday abbreviation - 2 letters for Russian
  const formatWeekday = (date: Date, locale: string) => {
    if (locale === "ru") {
      // Russian 2-letter weekday abbreviations
      const weekday = getDay(date);
      const russianWeekdays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
      return russianWeekdays[weekday];
    }
    // For other languages, use standard abbreviation
    return format(date, "EEE", { locale: dateLocale });
  };
  
  // Format month abbreviation for Russian (genitive case)
  const formatMonthAbbr = (date: Date, locale: string) => {
    if (locale === "ru") {
      // Russian month abbreviations in genitive: ДЕК.
      const monthAbbr = format(date, "LLL", { locale: dateLocale });
      // Ensure uppercase with dot: ДЕК.
      const cleanAbbr = monthAbbr.replace(/\./g, "").toUpperCase();
      return cleanAbbr + ".";
    }
    return format(date, "MMM", { locale: dateLocale }).toUpperCase();
  };

  // Ensure we're working with local dates to avoid timezone issues
  // Create dates explicitly in local timezone
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthStart = new Date(year, month, 1, 12, 0, 0);
  const monthEnd = new Date(year, month + 1, 0, 12, 0, 0); // Last day of month
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const getDayStatus = (date: Date): "available" | "booked" | "sunday" | "past" => {
    const dateStr = format(date, "yyyy-MM-dd");
    const weekday = getDay(date);
    const today = startOfDay(new Date());
    const dateOnly = startOfDay(date);
    
    if (weekday === 0) return "sunday";
    // Only mark as past if it's before today (not today itself)
    if (isBefore(dateOnly, today)) return "past";
    
    return availability[dateStr] || "available";
  };

  const getDayClassName = (date: Date, status: string, isSelected: boolean) => {
    const baseClasses = "p-2 sm:p-2 lg:p-1.5 rounded-lg border transition-all cursor-pointer min-h-[60px] sm:min-h-[70px] lg:min-h-[64px] flex flex-col justify-center items-center";
    
    if (isSelected) {
      return cn(
        baseClasses,
        "bg-amber-600/25 border-amber-500/60 text-amber-200 hover:bg-amber-600/35 hover:border-amber-500/80"
      );
    }

    switch (status) {
      case "sunday":
        return cn(
          baseClasses,
          "bg-gray-900/40 border-gray-800/60 text-gray-500 opacity-60 cursor-not-allowed"
        );
      case "booked":
      case "past":
        return cn(
          baseClasses,
          "bg-red-500/15 border-red-500/40 text-red-400/60 opacity-60 cursor-not-allowed"
        );
      case "available":
      default:
        return cn(
          baseClasses,
          "bg-green-500/20 border-green-500/50 text-green-400 hover:bg-green-500/30 hover:border-green-500/70"
        );
    }
  };

  return (
    <div className="space-y-6 lg:space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreviousMonth}
          className="h-10 w-10 sm:h-8 sm:w-8 lg:h-8 lg:w-8 hover:bg-gray-900/50"
        >
          <ChevronLeft className="h-4 w-4 lg:h-4 lg:w-4 text-gray-300" />
        </Button>
        <h2 className="text-lg sm:text-xl lg:text-xl font-semibold text-white">
          {formatMonth(currentMonth, locale)}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="h-10 w-10 sm:h-8 sm:w-8 lg:h-8 lg:w-8 hover:bg-gray-900/50"
        >
          <ChevronRight className="h-4 w-4 lg:h-4 lg:w-4 text-gray-300" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3 lg:gap-2">
        {/* Day Headers - Start with Monday */}
        {Array.from({ length: 7 }).map((_, i) => {
          // Start with Monday (i=0 = Monday, i=6 = Sunday)
          const dayOfWeek = (i + 1) % 7; // 1=Monday, 2=Tuesday, ..., 6=Saturday, 0=Sunday
          const dayDate = new Date(2024, 0, dayOfWeek === 0 ? 7 : dayOfWeek, 12, 0, 0); // Use a reference date at noon
          const dayAbbr = formatWeekday(dayDate, locale);
          return (
            <div key={i} className="text-center text-[10px] sm:text-sm lg:text-[12px] font-medium text-gray-400 pb-2 lg:pb-3">
              {dayAbbr}
            </div>
          );
        })}

        {/* Empty cells for days before month start */}
        {/* getDay returns 0 for Sunday, 1 for Monday, etc. We need to adjust for Monday = 0 */}
        {Array.from({ length: (getDay(monthStart) + 6) % 7 }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {/* Day Cards */}
        {days.map((date) => {
          // Ensure we're working with local date to avoid timezone issues
          // Create date at noon local time to avoid timezone shifts
          const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
          const status = getDayStatus(localDate);
          const isSelected = selectedDate ? isSameDay(localDate, selectedDate) : false;
          const isDisabled = disabled ? disabled(localDate) : false;
          const dateStr = format(localDate, "yyyy-MM-dd");
          const dayAbbr = formatWeekday(localDate, locale);
          const dayNumber = format(localDate, "d");
          const monthAbbr = formatMonthAbbr(localDate, locale);

          // Get localized tooltip text
          const getTooltip = (status: string) => {
            if (locale === "ru") {
              if (status === "sunday") return "Воскресенье (закрыто)";
              if (status === "booked") return "Занято";
              if (status === "past") return "Прошлое";
              return "Доступно";
            } else if (locale === "en") {
              if (status === "sunday") return "Sunday (closed)";
              if (status === "booked") return "Booked";
              if (status === "past") return "Past";
              return "Available";
            } else {
              // German (de)
              if (status === "sunday") return "Sonntag (geschlossen)";
              if (status === "booked") return "Ausgebucht";
              if (status === "past") return "Vergangen";
              return "Verfügbar";
            }
          };

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => !isDisabled && onDateSelect(localDate)}
              disabled={isDisabled || status === "sunday" || status === "booked" || status === "past"}
              title={getTooltip(status)}
              className={getDayClassName(localDate, status, isSelected)}
            >
              <div className="text-[9px] sm:text-xs lg:text-[10px] font-medium opacity-70 leading-tight">{dayAbbr}</div>
              <div className="text-base sm:text-lg lg:text-[15px] font-bold leading-tight">{dayNumber}</div>
              <div className="text-[9px] sm:text-xs lg:text-[10px] opacity-70 hidden sm:block leading-tight">{monthAbbr}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

