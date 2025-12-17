import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  dayAvailability?: Record<string, "available" | "booked" | "sunday">;
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  dayAvailability,
  ...props
}: CalendarProps) {
  const modifiers = React.useMemo(() => {
    const mods: Record<string, Date[]> = {};
    if (dayAvailability) {
      Object.entries(dayAvailability).forEach(([dateStr, status]) => {
        const key = `day-${status}`;
        if (!mods[key]) {
          mods[key] = [];
        }
        // Parse date string (YYYY-MM-DD) and set to noon to avoid timezone issues
        const [year, month, day] = dateStr.split("-").map(Number);
        const date = new Date(year, month - 1, day, 12, 0, 0);
        mods[key].push(date);
      });
    }
    return mods;
  }, [dayAvailability]);

  const modifierClassNames = React.useMemo(() => {
    return {
      "day-available": "bg-green-500/20 hover:bg-green-500/30 text-green-600 dark:text-green-400",
      "day-booked": "bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 opacity-50 cursor-not-allowed",
      "day-sunday": "bg-muted text-muted-foreground opacity-50 cursor-not-allowed",
    };
  }, []);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      modifiers={modifiers}
      modifiersClassNames={modifierClassNames}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...props }) => 
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

