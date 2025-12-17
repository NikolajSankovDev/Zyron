"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Users, Maximize2, Timer } from "lucide-react";
import type { CalendarSettings, BarberDisplayData } from "@/lib/types/admin-calendar";

interface CalendarSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: CalendarSettings;
  onSettingsChange: (settings: CalendarSettings) => void;
  barbers: BarberDisplayData[];
}

// Calculate time range from barber working hours
function calculateWorkingHoursRange(barbers: BarberDisplayData[]): { start: string; end: string } {
  if (barbers.length === 0) {
    return { start: "08:00", end: "20:00" };
  }

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

  return {
    start: `${earliestHour.toString().padStart(2, "0")}:${earliestMinute.toString().padStart(2, "0")}`,
    end: `${latestHour.toString().padStart(2, "0")}:${latestMinute.toString().padStart(2, "0")}`,
  };
}

// Generate time options based on working hours
function generateTimeOptions(startHour: number, endHour: number): string[] {
  const options: string[] = [];
  for (let hour = Math.max(0, startHour - 2); hour <= Math.min(23, endHour + 2); hour++) {
    options.push(`${hour.toString().padStart(2, "0")}:00`);
    options.push(`${hour.toString().padStart(2, "0")}:30`);
  }
  return options;
}

export function CalendarSettingsModal({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
  barbers,
}: CalendarSettingsProps) {
  const [localSettings, setLocalSettings] = useState<CalendarSettings>(settings);
  
  // Sync local settings when modal opens
  useEffect(() => {
    if (open) {
      setLocalSettings(settings);
    }
  }, [open, settings]);
  
  // Calculate working hours range
  const workingHoursRange = calculateWorkingHoursRange(barbers);
  const [minHour] = workingHoursRange.start.split(":").map(Number);
  const [maxHour] = workingHoursRange.end.split(":").map(Number);
  
  // Generate time options based on working hours
  const startTimeOptions = generateTimeOptions(minHour, maxHour);
  
  // For end time, only show options after selected start time
  const getEndTimeOptions = () => {
    const [startHour, startMinute] = localSettings.timeRange.start.split(":").map(Number);
    const startMinutes = startHour * 60 + startMinute;
    return generateTimeOptions(minHour, maxHour).filter((time) => {
      const [hour, minute] = time.split(":").map(Number);
      const timeMinutes = hour * 60 + minute;
      return timeMinutes > startMinutes;
    });
  };
  
  const endTimeOptions = getEndTimeOptions();

  const handleSave = () => {
    onSettingsChange(localSettings);
    onOpenChange(false);
  };

  const handleSelectAll = () => {
    setLocalSettings((prev) => ({
      ...prev,
      selectedBarberIds: barbers.map(b => b.id),
    }));
  };

  const handleDeselectAll = () => {
    setLocalSettings((prev) => ({
      ...prev,
      selectedBarberIds: [],
    }));
  };

  const toggleBarber = (barberId: string) => {
    setLocalSettings((prev) => {
      const isSelected = prev.selectedBarberIds.includes(barberId);
      return {
        ...prev,
        selectedBarberIds: isSelected
          ? prev.selectedBarberIds.filter((id) => id !== barberId)
          : [...prev.selectedBarberIds, barberId],
      };
    });
  };

  const intervalHeightOptions = [
    { value: "small", label: "Compact", description: "28px per slot" },
    { value: "medium", label: "Standard", description: "40px per slot" },
    { value: "large", label: "Spacious", description: "55px per slot" },
  ];

  const timeIntervalOptions = [
    { value: 15, label: "15 min", description: "More detailed" },
    { value: 30, label: "30 min", description: "Balanced" },
    { value: 60, label: "60 min", description: "Overview" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700/50 text-white max-w-xl max-h-[85vh] overflow-y-auto rounded-xl">
        <DialogHeader className="pb-4 border-b border-gray-700/50">
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            Calendar Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Barbers Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <Label className="text-white font-semibold">Visible Barbers</Label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Select all
                </button>
                <span className="text-gray-600">|</span>
                <button
                  onClick={handleDeselectAll}
                  className="text-xs text-gray-400 hover:text-white transition-colors font-medium"
                >
                  Deselect all
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {barbers.map((barber) => {
                const isSelected = localSettings.selectedBarberIds.includes(barber.id);
                return (
                  <div
                    key={barber.id}
                    onClick={() => toggleBarber(barber.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
                      isSelected 
                        ? "bg-primary/10 border-primary/50 hover:bg-primary/15" 
                        : "bg-gray-800/50 border-gray-700/50 hover:bg-gray-800 hover:border-gray-600"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleBarber(barber.id)}
                      className="border-gray-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      {barber.avatar ? (
                        <img
                          src={barber.avatar}
                          alt={barber.displayName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                          {barber.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className={`font-medium ${isSelected ? "text-white" : "text-gray-300"}`}>
                        {barber.displayName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time Range Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <Label className="text-white font-semibold">Visible Hours</Label>
            </div>
            <p className="text-sm text-gray-400">
              Set the time range displayed on the calendar. Based on barber working hours: {workingHoursRange.start} - {workingHoursRange.end}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-gray-400 text-xs mb-1.5 block uppercase tracking-wide">From</Label>
                <Select
                  value={localSettings.timeRange.start}
                  onValueChange={(value) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      timeRange: { ...prev.timeRange, start: value },
                    }))
                  }
                >
                  <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white hover:bg-gray-800 hover:border-gray-600 rounded-lg h-11 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white rounded-lg">
                    {startTimeOptions.map((time) => (
                      <SelectItem 
                        key={time} 
                        value={time} 
                        className="text-white focus:bg-gray-700 focus:text-white cursor-pointer rounded-md"
                      >
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-gray-500 pt-6">→</div>
              <div className="flex-1">
                <Label className="text-gray-400 text-xs mb-1.5 block uppercase tracking-wide">To</Label>
                <Select
                  value={localSettings.timeRange.end}
                  onValueChange={(value) =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      timeRange: { ...prev.timeRange, end: value },
                    }))
                  }
                >
                  <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white hover:bg-gray-800 hover:border-gray-600 rounded-lg h-11 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white rounded-lg">
                    {endTimeOptions.map((time) => (
                      <SelectItem 
                        key={time} 
                        value={time} 
                        className="text-white focus:bg-gray-700 focus:text-white cursor-pointer rounded-md"
                      >
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Time Interval Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              <Label className="text-white font-semibold">Time Interval</Label>
            </div>
            <p className="text-sm text-gray-400">
              Duration of each time slot on the calendar
            </p>
            <div className="grid grid-cols-3 gap-2">
              {timeIntervalOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      timeInterval: option.value as 15 | 30 | 60,
                    }))
                  }
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-200 ${
                    localSettings.timeInterval === option.value
                      ? "bg-primary/15 border-primary/50 text-white"
                      : "bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-800 hover:border-gray-600 hover:text-white"
                  }`}
                >
                  <span className="font-semibold text-lg">{option.label}</span>
                  <span className="text-xs opacity-70">{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interval Height Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Maximize2 className="h-4 w-4 text-primary" />
              <Label className="text-white font-semibold">Row Height</Label>
            </div>
            <p className="text-sm text-gray-400">
              Adjust the vertical spacing of time slots
            </p>
            <div className="grid grid-cols-3 gap-2">
              {intervalHeightOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      intervalHeight: option.value as "small" | "medium" | "large",
                    }))
                  }
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-200 ${
                    localSettings.intervalHeight === option.value
                      ? "bg-primary/15 border-primary/50 text-white"
                      : "bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-800 hover:border-gray-600 hover:text-white"
                  }`}
                >
                  <span className="font-semibold">{option.label}</span>
                  <span className="text-xs opacity-70">{option.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/50">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg px-6"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            className="bg-primary hover:bg-primary/90 text-white rounded-lg px-6 shadow-lg shadow-primary/20"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
