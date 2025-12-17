"use client";

import { useState } from "react";
import { format } from "date-fns";
import { X, Trash2, MoreVertical, UserCheck, CalendarX, Calendar, RotateCcw, Briefcase, FileText, ArrowLeft, Clock, User, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { AppointmentDisplayData } from "@/lib/types/admin-calendar";

interface AppointmentDetailPanelProps {
  appointment: AppointmentDisplayData | null;
  onClose: () => void;
  onDelete?: (appointmentId: string) => void;
  onCheckout?: (appointmentId: string) => void;
  onMarkArrived?: (appointmentId: string) => void;
  onMarkMissed?: (appointmentId: string) => void;
  onReschedule?: (appointmentId: string) => void;
  onBookAgain?: (appointmentId: string) => void;
  onAddService?: (appointmentId: string) => void;
  onAddNote?: (appointmentId: string) => void;
}

export function AppointmentDetailPanel({
  appointment,
  onClose,
  onDelete,
  onCheckout,
  onMarkArrived,
  onMarkMissed,
  onReschedule,
  onBookAgain,
  onAddService,
  onAddNote,
}: AppointmentDetailPanelProps) {
  const [activeTab, setActiveTab] = useState("info");
  const t = useTranslations("admin");

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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/20">
            <CheckCircle className="h-3 w-3" />
            {status === "COMPLETED" ? "Completed" : "Arrived"}
          </span>
        );
      case "MISSED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/20">
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/20">
            <Clock className="h-3 w-3" />
            Booked
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-gray-900 border-l border-gray-700/50 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gray-800/40">
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
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>
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
              value="payment" 
              className="flex-1 rounded-lg data-[state=active]:bg-gray-700 data-[state=active]:text-white text-gray-400"
            >
              Payment
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
                  {formatTime(new Date(appointment.startTime))} - {formatTime(new Date(appointment.endTime))} ({duration} mins)
                </p>
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

          {/* Payment Tab */}
          <TabsContent value="payment" className="space-y-4 mt-0">
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-800/50 flex items-center justify-center">
                <Clock className="h-8 w-8 text-gray-500" />
              </div>
              <p className="text-gray-300 font-medium">Payment Processing</p>
              <p className="text-sm text-gray-500 mt-2">Payment interface coming soon</p>
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-0">
            <div className="space-y-4">
              {/* Status */}
              <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
                <p className="text-sm text-gray-400 mb-2">Current Status</p>
                {getStatusBadge(appointment.status)}
              </div>

              {/* Notes */}
              {appointment.notes && (
                <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-400">Notes</p>
                  </div>
                  <p className="text-white">{appointment.notes}</p>
                </div>
              )}

              {/* Services Breakdown */}
              <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/50">
                <p className="text-sm text-gray-400 mb-3">{t("services")}</p>
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
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Footer Actions */}
      <div className="border-t border-gray-700/50 p-4 space-y-3 bg-gray-800/40">
        <div className="flex items-center justify-between pb-3 border-b border-gray-700/30">
          <span className="text-sm text-gray-400">Balance to pay</span>
          <span className="text-xl font-bold text-white">€{appointment.totalPrice.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete?.(appointment.id)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl h-11 w-11"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
          <Button
            onClick={() => onCheckout?.(appointment.id)}
            className="flex-1 bg-primary hover:bg-primary/90 rounded-xl h-11 font-semibold shadow-lg shadow-primary/20"
          >
            Checkout
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl h-11 w-11"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700/50 rounded-xl w-48">
              <DropdownMenuItem
                onClick={() => onMarkArrived?.(appointment.id)}
                className="text-white focus:bg-gray-700 focus:text-white rounded-lg cursor-pointer"
              >
                <UserCheck className="h-4 w-4 mr-2 text-green-400" />
                Mark arrived
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onMarkMissed?.(appointment.id)}
                className="text-white focus:bg-gray-700 focus:text-white rounded-lg cursor-pointer"
              >
                <CalendarX className="h-4 w-4 mr-2 text-red-400" />
                Mark missed
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700/50" />
              <DropdownMenuItem
                onClick={() => onReschedule?.(appointment.id)}
                className="text-white focus:bg-gray-700 focus:text-white rounded-lg cursor-pointer"
              >
                <Calendar className="h-4 w-4 mr-2 text-primary" />
                Reschedule
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onBookAgain?.(appointment.id)}
                className="text-white focus:bg-gray-700 focus:text-white rounded-lg cursor-pointer"
              >
                <RotateCcw className="h-4 w-4 mr-2 text-blue-400" />
                Book again
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700/50" />
              <DropdownMenuItem
                onClick={() => onAddService?.(appointment.id)}
                className="text-white focus:bg-gray-700 focus:text-white rounded-lg cursor-pointer"
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Add service
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onAddNote?.(appointment.id)}
                className="text-white focus:bg-gray-700 focus:text-white rounded-lg cursor-pointer"
              >
                <FileText className="h-4 w-4 mr-2" />
                Add note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
