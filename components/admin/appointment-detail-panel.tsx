"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { X, Trash2, MoreVertical, UserCheck, CalendarX, Calendar, Briefcase, FileText, ArrowLeft, Clock, User, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useScrollbarFix } from "@/lib/hooks/use-scrollbar-fix";
import type { AppointmentDisplayData } from "@/lib/types/admin-calendar";

interface AppointmentDetailPanelProps {
  appointment: AppointmentDisplayData | null;
  onClose: () => void;
  onDelete?: (appointmentId: string) => void;
  onMarkArrived?: (appointmentId: string) => void;
  onMarkMissed?: (appointmentId: string) => void;
  onMarkBooked?: (appointmentId: string) => void;
  onReschedule?: (appointmentId: string) => void;
  onAddNote?: (appointmentId: string) => void;
  onUpdateDuration?: (appointmentId: string, durationMinutes: number) => void;
}

export function AppointmentDetailPanel({
  appointment,
  onClose,
  onDelete,
  onMarkArrived,
  onMarkMissed,
  onMarkBooked,
  onReschedule,
  onAddNote,
  onUpdateDuration,
}: AppointmentDetailPanelProps) {
  const [activeTab, setActiveTab] = useState("info");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownAlign, setDropdownAlign] = useState<"start" | "end">("end");
  const [alignOffset, setAlignOffset] = useState(-8);
  const [dropdownTransform, setDropdownTransform] = useState<string | undefined>(undefined);
  const dropdownContentRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const t = useTranslations("admin");

  // Prevent scrollbar layout shift when dropdown opens
  useScrollbarFix(dropdownOpen);

  // #region agent log
  useEffect(() => {
    if (!dropdownOpen || !dropdownContentRef.current || !triggerRef.current) return;
    
    const content = dropdownContentRef.current;
    const trigger = triggerRef.current;
    
    const adjustWidth = () => {
      if (!content || !trigger) return;
      
      const triggerRect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const padding = 16;
      
      let maxWidth: number;
      if (dropdownAlign === "start") {
        // For start alignment, available space is from trigger left to viewport right
        maxWidth = viewportWidth - triggerRect.left - padding;
      } else {
        // For end alignment, available space is from viewport left to trigger right
        maxWidth = triggerRect.right - padding;
      }
      
      // Ensure minimum width of 180px and maximum of 224px
      const newWidth = Math.min(224, Math.max(180, maxWidth));
      
      content.style.width = `${newWidth}px`;
      content.style.maxWidth = `${newWidth}px`;
      
      // Also adjust position if still overflowing
      const rect = content.getBoundingClientRect();
      if (rect.right > viewportWidth - padding) {
        const overflow = rect.right - (viewportWidth - padding);
        const currentLeft = parseFloat(window.getComputedStyle(content).left) || rect.left;
        content.style.setProperty('left', `${currentLeft - overflow}px`, 'important');
      }
      
      // #region agent log
      const logData = {
        location: 'appointment-detail-panel.tsx:adjustWidth',
        message: 'Width and position adjusted',
        data: {
          triggerRect,
          viewportWidth,
          dropdownAlign,
          calculatedMaxWidth: maxWidth,
          appliedWidth: newWidth,
          finalRect: content.getBoundingClientRect(),
          isWithinViewport: content.getBoundingClientRect().right <= viewportWidth - padding,
        },
        timestamp: Date.now(),
        sessionId: 'debug-session',
        runId: 'post-fix-v5',
        hypothesisId: 'A'
      };
      fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      }).catch(() => {});
      // #endregion
    };
    
    // Adjust after Radix positions it
    const timeout1 = setTimeout(adjustWidth, 10);
    const timeout2 = setTimeout(adjustWidth, 50);
    const timeout3 = setTimeout(adjustWidth, 100);
    
    // Watch for style changes
    const observer = new MutationObserver(adjustWidth);
    observer.observe(content, {
      attributes: true,
      attributeFilter: ['style'],
    });
    
    return () => {
      observer.disconnect();
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [dropdownOpen, dropdownAlign, alignOffset]);
  // #endregion

  if (!appointment) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date) => {
    return format(date, "EEEE, do MMMM yyyy");
  };

  const formatTime = (date: Date) => {
    return format(date, "HH:mm");
  };

  const duration = Math.round(
    (new Date(appointment.endTime).getTime() - new Date(appointment.startTime).getTime()) /
      (1000 * 60)
  );

  const serviceName = appointment.services[0]?.serviceName || t("service");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ARRIVED":
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-600/30 text-green-300 border-2 border-green-500/50">
            <CheckCircle className="h-3 w-3" />
            {status === "COMPLETED" ? "Completed" : "Arrived"}
          </span>
        );
      case "MISSED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-600/30 text-red-300 border-2 border-red-500/50">
            <AlertCircle className="h-3 w-3" />
            Missed
          </span>
        );
      case "CANCELED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/15 text-gray-400 border border-gray-500/20">
            <XCircle className="h-3 w-3" />
            Canceled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-600/30 text-blue-300 border-2 border-blue-500/50">
            <Clock className="h-3 w-3" />
            Booked
          </span>
        );
    }
  };

  // Status can be changed for BOOKED, ARRIVED, and MISSED
  const canChangeStatus = appointment.status === "BOOKED" || appointment.status === "ARRIVED" || appointment.status === "MISSED";

  return (
    <div 
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-gray-900 border-l border-gray-700/50 shadow-2xl flex flex-col overflow-visible"
      ref={(el) => {
        if (el) {
          // #region agent log
          const logData = {
            location: 'appointment-detail-panel.tsx:container-ref',
            message: 'Panel container mounted - checking overflow constraints',
            data: {
              containerRect: el.getBoundingClientRect(),
              containerStyles: {
                overflow: window.getComputedStyle(el).overflow,
                overflowX: window.getComputedStyle(el).overflowX,
                overflowY: window.getComputedStyle(el).overflowY,
                position: window.getComputedStyle(el).position,
                zIndex: window.getComputedStyle(el).zIndex,
              },
              parentElement: el.parentElement ? {
                tagName: el.parentElement.tagName,
                overflow: window.getComputedStyle(el.parentElement).overflow,
                position: window.getComputedStyle(el.parentElement).position,
              } : null,
            },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'C'
          };
          fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logData)
          }).catch(() => {});
          // #endregion
        }
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gray-800/40 relative z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-400" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Appointment Details
            </h2>
            <p className="text-sm text-gray-400">
              {formatTime(new Date(appointment.startTime))} - {formatTime(new Date(appointment.endTime))}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu 
            open={dropdownOpen} 
            onOpenChange={(open) => {
              if (open && triggerRef.current) {
                // Calculate alignment and offset before opening
                const triggerRect = triggerRef.current.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const dropdownWidth = 224; // w-56 = 224px
                const padding = 16; // Padding from viewport edges
                const spaceOnRight = viewportWidth - triggerRect.right;
                const spaceOnLeft = triggerRect.left;
                
                let calculatedOffset = -8;
                let calculatedAlign: "start" | "end" = "end";
                
                if (spaceOnRight < dropdownWidth && spaceOnLeft >= dropdownWidth) {
                  // Align to start (left), but calculate offset to prevent overflow
                  calculatedAlign = "start";
                  const maxRight = viewportWidth - padding;
                  const calculatedRight = triggerRect.left + dropdownWidth;
                  if (calculatedRight > maxRight) {
                    const overflow = calculatedRight - maxRight;
                    calculatedOffset = 8 - overflow; // Negative offset to shift left
                    // Also set transform to shift left
                    setDropdownTransform(`translateX(-${overflow}px)`);
                  } else {
                    calculatedOffset = 8;
                    setDropdownTransform(undefined);
                  }
                } else {
                  // Align to end (right), but calculate offset to prevent overflow
                  calculatedAlign = "end";
                  const minLeft = padding;
                  const calculatedLeft = triggerRect.right - dropdownWidth;
                  if (calculatedLeft < minLeft) {
                    const overflow = minLeft - calculatedLeft;
                    calculatedOffset = -8 + overflow; // Positive offset to shift right
                    setDropdownTransform(`translateX(${overflow}px)`);
                  } else {
                    calculatedOffset = -8;
                    setDropdownTransform(undefined);
                  }
                }
                
                // #region agent log
                const logData = {
                  location: 'appointment-detail-panel.tsx:onOpenChange',
                  message: 'Calculating dropdown position',
                  data: {
                    viewportWidth,
                    triggerRect,
                    spaceOnRight,
                    spaceOnLeft,
                    dropdownWidth,
                    calculatedAlign,
                    calculatedOffset,
                    expectedRight: calculatedAlign === "start" ? triggerRect.left + dropdownWidth + (calculatedOffset - 8) : triggerRect.right - dropdownWidth + (calculatedOffset + 8),
                    maxRight: viewportWidth - padding,
                  },
                  timestamp: Date.now(),
                  sessionId: 'debug-session',
                  runId: 'post-fix-v2',
                  hypothesisId: 'A'
                };
                fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(logData)
                }).catch(() => {});
                // #endregion
                
                setDropdownAlign(calculatedAlign);
                setAlignOffset(calculatedOffset);
              }
              setDropdownOpen(open);
            }}
          >
            <DropdownMenuTrigger asChild>
              <button 
                ref={triggerRef}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <MoreVertical className="h-5 w-5 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              ref={dropdownContentRef}
              align={dropdownAlign}
              side="bottom"
              sideOffset={8}
              alignOffset={alignOffset}
              className="bg-gray-800 border-gray-700/50 rounded-xl w-56 max-h-[min(400px,calc(100vh-2rem))] overflow-y-auto z-[9999] shadow-2xl"
              style={{
                maxWidth: 'min(224px, calc(100vw - 2rem))',
                position: 'fixed',
                ...(dropdownTransform && { transform: dropdownTransform }),
              }}
            >
              {canChangeStatus && (
                <>
                  {appointment.status !== "ARRIVED" && appointment.status !== "MISSED" && (
                    <DropdownMenuItem
                      onClick={() => onMarkArrived?.(appointment.id)}
                      className="text-white focus:bg-gray-700 focus:text-white rounded-lg cursor-pointer"
                    >
                      <UserCheck className="h-4 w-4 mr-2 text-green-400" />
                      Mark arrived
                    </DropdownMenuItem>
                  )}
                  {appointment.status !== "MISSED" && (
                    <DropdownMenuItem
                      onClick={() => onMarkMissed?.(appointment.id)}
                      className="text-white focus:bg-gray-700 focus:text-white rounded-lg cursor-pointer"
                    >
                      <CalendarX className="h-4 w-4 mr-2 text-red-400" />
                      Mark missed
                    </DropdownMenuItem>
                  )}
                  {appointment.status === "MISSED" && (
                    <DropdownMenuItem
                      onClick={() => onMarkBooked?.(appointment.id)}
                      className="text-white focus:bg-gray-700 focus:text-white rounded-lg cursor-pointer"
                    >
                      <Clock className="h-4 w-4 mr-2 text-primary" />
                      Mark as Booked
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-gray-700/50" />
                </>
              )}
              <DropdownMenuItem
                onClick={() => onReschedule?.(appointment.id)}
                className="text-white focus:bg-gray-700 focus:text-white rounded-lg cursor-pointer"
              >
                <Calendar className="h-4 w-4 mr-2 text-primary" />
                Reschedule
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700/50" />
              <DropdownMenuItem
                onClick={() => onAddNote?.(appointment.id)}
                className="text-white focus:bg-gray-700 focus:text-white rounded-lg cursor-pointer"
              >
                <FileText className="h-4 w-4 mr-2" />
                Add note
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700/50" />
              <DropdownMenuItem
                onClick={() => onDelete?.(appointment.id)}
                className="text-red-400 focus:bg-red-500/10 focus:text-red-300 rounded-lg cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete appointment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Client Info */}
      <div className="p-4 border-b border-gray-700/50 bg-gray-800/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-lg font-bold text-primary border border-primary/20">
            {getInitials(appointment.customerName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-lg truncate">{appointment.customerName}</p>
            {appointment.customerPhone && (
              <p className="text-sm text-gray-400 truncate">{appointment.customerPhone}</p>
            )}
            <p className="text-xs text-gray-500 truncate">{appointment.customerEmail}</p>
          </div>
          {getStatusBadge(appointment.status)}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-4">
          <TabsList className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl p-1">
            <TabsTrigger 
              value="info" 
              className="flex-1 rounded-lg data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400"
            >
              Info
            </TabsTrigger>
            <TabsTrigger 
              value="details" 
              className="flex-1 rounded-lg data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400"
            >
              Details
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4 mt-0">
            <div className="space-y-4">
              {/* Date Card */}
              <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary/15 rounded-lg">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-gray-400">Date & Time</span>
                </div>
                <p className="text-white font-medium">{formatDate(new Date(appointment.startTime))}</p>
                <p className="text-gray-400 text-sm mt-1">
                  {formatTime(new Date(appointment.startTime))} - {formatTime(new Date(appointment.endTime))}
                </p>
                {onUpdateDuration && appointment.status !== "CANCELED" && appointment.status !== "COMPLETED" ? (
                  <div className="mt-3 pt-3 border-t border-gray-700/50">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <label className="text-xs sm:text-sm font-medium text-gray-400 flex-shrink-0">
                        Duration:
                      </label>
                      <Select
                        value={duration.toString()}
                        onValueChange={(value) => {
                          const newDuration = parseInt(value);
                          if (newDuration !== duration && onUpdateDuration) {
                            onUpdateDuration(appointment.id, newDuration);
                          }
                        }}
                      >
                        <SelectTrigger className="h-9 sm:h-10 w-full sm:w-[140px] bg-gray-700/60 border-gray-600/50 text-white text-sm hover:bg-gray-700/80 hover:border-gray-600 transition-colors focus:ring-2 focus:ring-primary/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 text-white">
                          {![15, 30, 45, 60, 90, 120].includes(duration) && (
                            <SelectItem value={duration.toString()} className="focus:bg-gray-700 focus:text-white">
                              {duration} min
                            </SelectItem>
                          )}
                          <SelectItem value="15" className="focus:bg-gray-700 focus:text-white">15 min</SelectItem>
                          <SelectItem value="30" className="focus:bg-gray-700 focus:text-white">30 min</SelectItem>
                          <SelectItem value="45" className="focus:bg-gray-700 focus:text-white">45 min</SelectItem>
                          <SelectItem value="60" className="focus:bg-gray-700 focus:text-white">60 min</SelectItem>
                          <SelectItem value="90" className="focus:bg-gray-700 focus:text-white">90 min</SelectItem>
                          <SelectItem value="120" className="focus:bg-gray-700 focus:text-white">120 min</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs mt-2">{duration} minutes</p>
                )}
              </div>

              {/* Service Card */}
              <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary/15 rounded-lg">
                    <Briefcase className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-gray-400">{t("service")}</span>
                </div>
                <p className="text-white font-medium">{serviceName}</p>
                <p className="text-gray-400 text-sm mt-1">with {appointment.barberName}</p>
              </div>

              {/* Price Summary */}
              <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Price</span>
                  <span className="text-2xl font-bold text-white">€{appointment.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-0">
            <div className="space-y-4">
              {/* Quick Actions - Status Changes */}
              {canChangeStatus && (
                <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
                  <p className="text-sm text-gray-400 mb-3">Quick Actions</p>
                  <div className="flex flex-col gap-2">
                    {appointment.status !== "ARRIVED" && appointment.status !== "MISSED" && (
                      <Button
                        onClick={() => onMarkArrived?.(appointment.id)}
                        variant="outline"
                        className="w-full justify-start border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Mark as Arrived
                      </Button>
                    )}
                    {appointment.status !== "MISSED" && (
                      <Button
                        onClick={() => onMarkMissed?.(appointment.id)}
                        variant="outline"
                        className="w-full justify-start border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <CalendarX className="h-4 w-4 mr-2" />
                        Mark as Missed
                      </Button>
                    )}
                    {appointment.status === "MISSED" && (
                      <Button
                        onClick={() => onMarkBooked?.(appointment.id)}
                        variant="outline"
                        className="w-full justify-start border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Mark as Booked
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
                <p className="text-sm text-gray-400 mb-2">Current Status</p>
                {getStatusBadge(appointment.status)}
              </div>

              {/* Services Breakdown */}
              <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-400">{t("services")}</p>
                </div>
                <div className="space-y-2">
                  {appointment.services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between py-2 border-b border-gray-700/30 last:border-0">
                      <span className="text-white">{service.serviceName}</span>
                      <span className="text-gray-300 font-medium">€{service.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Info */}
              <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-400">Customer Information</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name</span>
                    <span className="text-white">{appointment.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email</span>
                    <span className="text-white">{appointment.customerEmail}</span>
                  </div>
                  {appointment.customerPhone && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Phone</span>
                      <span className="text-white">{appointment.customerPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {appointment.notes ? (
                <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-400">Notes</p>
                  </div>
                  <p className="text-white">{appointment.notes}</p>
                </div>
              ) : (
                <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-400">Notes</p>
                  </div>
                  <p className="text-sm text-gray-500 italic">No notes added</p>
                </div>
              )}

              {/* Additional Actions */}
              <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
                <p className="text-sm text-gray-400 mb-3">Additional Actions</p>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => onReschedule?.(appointment.id)}
                    variant="outline"
                    className="w-full justify-start border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Reschedule Appointment
                  </Button>
                  <Button
                    onClick={() => onAddNote?.(appointment.id)}
                    variant="outline"
                    className="w-full justify-start border-gray-600/30 text-gray-300 hover:bg-gray-700/50 hover:text-white"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
