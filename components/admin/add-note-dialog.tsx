"use client";

import { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppointmentDisplayData } from "@/lib/types/admin-calendar";

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentDisplayData | null;
  onConfirm: (appointmentId: string, notes: string) => Promise<void>;
}

export function AddNoteDialog({
  open,
  onOpenChange,
  appointment,
  onConfirm,
}: AddNoteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const t = useTranslations("admin");

  // Initialize notes when dialog opens or appointment changes
  useEffect(() => {
    if (open && appointment) {
      setNotes(appointment.notes || "");
    }
  }, [open, appointment]);

  const handleConfirm = async () => {
    if (!appointment) return;
    
    setLoading(true);
    try {
      await onConfirm(appointment.id, notes);
      onOpenChange(false);
    } catch (error) {
      console.error("Update note error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {appointment.notes ? "Edit Note" : "Add Note"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Appointment Info */}
          <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Appointment</div>
            <div className="text-white font-medium">{appointment.customerName}</div>
            <div className="text-xs text-gray-400 mt-1">
              {appointment.services.map(s => s.serviceName).join(", ")}
            </div>
          </div>

          {/* Notes Textarea */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this appointment..."
              disabled={loading}
              className={cn(
                "flex min-h-[120px] w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white",
                "placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              )}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            {t("cancel") || "Cancel"}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            {loading ? (t("saving") || "Saving...") : (t("save") || "Save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

