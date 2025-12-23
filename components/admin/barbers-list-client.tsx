"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { AddBarberDialog } from "./add-barber-dialog";
import { EditBarberDialog } from "./edit-barber-dialog";
import { BarberTimeOffDialog } from "./barber-time-off-dialog";
import { CancelAppointmentsDialog } from "./cancel-appointments-dialog";
import { toggleBarberActiveAction } from "@/lib/actions/barber";
import { useRouter } from "next/navigation";
import { Calendar, X } from "lucide-react";

interface Barber {
  id: string;
  displayName: string;
  languages: string[];
  bio?: string | null;
  active: boolean;
  user: {
    email: string;
    name: string;
    phone: string;
  };
  _count: {
    appointments: number;
  };
}

interface BarbersListClientProps {
  barbers: Barber[];
}

export function BarbersListClient({ barbers: initialBarbers }: BarbersListClientProps) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/admin/barbers-list-client.tsx:BarbersListClient:entry',message:'Component rendering',data:{barberCount:initialBarbers.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  const [barbers, setBarbers] = useState(initialBarbers);
  
  // Update state when props change (after router.refresh())
  useEffect(() => {
    setBarbers(initialBarbers);
  }, [initialBarbers]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [timeOffDialogOpen, setTimeOffDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [togglingActive, setTogglingActive] = useState<string | null>(null);
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const router = useRouter();
  
  // #region agent log
  useEffect(() => {
    console.log('[DEBUG] BarbersListClient useEffect - component mounted', { addDialogOpen, editDialogOpen, barberCount: barbers.length });
    fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/admin/barbers-list-client.tsx:BarbersListClient:useEffect',message:'Component mounted/client hydrated',data:{addDialogOpen,editDialogOpen,barberCount:barbers.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
  }, []);
  // #endregion
  
  // #region agent log
  useEffect(() => {
    console.log('[DEBUG] addDialogOpen state changed', { addDialogOpen });
    fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/admin/barbers-list-client.tsx:BarbersListClient:addDialogOpen-changed',message:'addDialogOpen state changed',data:{addDialogOpen,previous:!addDialogOpen},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch((err) => console.error('[DEBUG] Log fetch failed', err));
  }, [addDialogOpen]);
  // #endregion

  const handleAddSuccess = () => {
    router.refresh();
  };

  const handleEditSuccess = () => {
    router.refresh();
  };

  const handleToggleActive = async (barberId: string) => {
    if (togglingActive) return;
    setTogglingActive(barberId);
    const result = await toggleBarberActiveAction(barberId);
    setTogglingActive(null);
    if (result?.success) {
      router.refresh();
    }
  };

  const handleEditClick = (barber: Barber) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/admin/barbers-list-client.tsx:handleEditClick',message:'Edit button handler called',data:{barberId:barber.id,currentState:{editDialogOpen,selectedBarber:selectedBarber?.id}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,D'})}).catch(()=>{});
    // #endregion
    console.log("Edit clicked for barber:", barber.id);
    setSelectedBarber(barber);
    setEditDialogOpen(true);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/admin/barbers-list-client.tsx:handleEditClick:after-setState',message:'State setters called for edit',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
  };

  const handleTimeOffClick = (barber: Barber) => {
    console.log("Time off clicked for barber:", barber.id);
    setSelectedBarber(barber);
    setTimeOffDialogOpen(true);
  };

  const handleCancelClick = (barber: Barber) => {
    console.log("Cancel clicked for barber:", barber.id);
    setSelectedBarber(barber);
    setCancelDialogOpen(true);
  };

  // Simple direct log to verify component is executing
  if (typeof window !== 'undefined') {
    console.log('[DEBUG] BarbersListClient rendering on client', { barberCount: barbers.length, addDialogOpen, editDialogOpen });
  }
  
  return (
    <>
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 lg:h-full flex flex-col lg:overflow-y-auto overflow-visible min-h-0" data-admin-page="barbers">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 flex-shrink-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{t("barbers")}</h1>
            <p className="text-sm sm:text-base text-gray-400 mt-1">{t("manageBarberAccounts")}</p>
          </div>
          <Button 
            onClick={() => {
              console.log("[DEBUG] Add barber button clicked", { addDialogOpen });
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/admin/barbers-list-client.tsx:AddButton:onClick',message:'Add barber button onClick fired',data:{currentState:{addDialogOpen}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,D'})}).catch(()=>{});
              // #endregion
              setAddDialogOpen(true);
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/admin/barbers-list-client.tsx:AddButton:onClick:after-setState',message:'setAddDialogOpen called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
              // #endregion
            }}
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto text-sm sm:text-base"
            type="button"
          >
            {t("addBarber")}
          </Button>
        </div>

        <Card className="bg-gray-900 border-gray-800 flex flex-col lg:flex-1 lg:min-h-0">
          <CardHeader className="flex-shrink-0 px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg text-white">{t("allBarbers")}</CardTitle>
          </CardHeader>
          <CardContent className="lg:flex-1 lg:overflow-y-auto lg:min-h-0 px-3 sm:px-6 pb-8 lg:pb-6">
            {barbers.length === 0 ? (
              <p className="text-sm sm:text-base text-gray-400">
                {t("noBarbersFound")}
              </p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {barbers.map((barber) => (
                  <div
                    key={barber.id}
                    className="p-3 sm:p-4 border border-gray-800 rounded-lg bg-black/50"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 sm:gap-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm sm:text-base">{barber.displayName}</p>
                          <p className="text-xs sm:text-sm text-gray-400 mt-1 break-words">
                            {barber.user?.email || ""}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-400 mt-1">
                            {t("languages")}: {barber.languages?.join(", ") || ""}
                          </p>
                          <p className="text-xs sm:text-sm text-white mt-1">
                            {t("appointments")}: {barber._count?.appointments || 0}
                          </p>
                        </div>
                        <div className="flex gap-2 items-center flex-shrink-0 w-full sm:w-auto">
                          <button
                            onClick={() => handleToggleActive(barber.id)}
                            disabled={togglingActive === barber.id}
                            className={`text-xs px-2 py-1 rounded whitespace-nowrap border cursor-pointer transition-colors ${
                              barber.active
                                ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
                                : "bg-gray-700 text-gray-400 border-gray-600 hover:bg-gray-600"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {togglingActive === barber.id
                              ? tCommon("loading")
                              : barber.active
                              ? t("active")
                              : t("inactive")}
                          </button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log("[DEBUG] Edit button clicked", { barberId: barber.id });
                              handleEditClick(barber);
                            }}
                            className="border-gray-700 text-white hover:bg-gray-800 text-xs sm:text-sm"
                            type="button"
                          >
                            {tCommon("edit")}
                          </Button>
                        </div>
                      </div>
                      {/* Action buttons row */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-800">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTimeOffClick(barber)}
                          className="border-gray-700 text-white hover:bg-gray-800 text-xs"
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          {t("timeOff")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelClick(barber)}
                          className="border-red-700 text-red-400 hover:bg-red-900/20 text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          {t("cancelAppointments")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      {/* #region agent log */}
      {(() => {
        fetch('http://127.0.0.1:7242/ingest/9f5e9b37-a81e-4c80-8472-90acdcaf9aff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/admin/barbers-list-client.tsx:AddBarberDialog:render',message:'AddBarberDialog rendering',data:{open:addDialogOpen},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        return null;
      })()}
      {/* #endregion */}
      <AddBarberDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleAddSuccess}
      />
      {selectedBarber && (
        <>
          <EditBarberDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            barber={selectedBarber}
            onSuccess={handleEditSuccess}
          />
          <BarberTimeOffDialog
            open={timeOffDialogOpen}
            onOpenChange={setTimeOffDialogOpen}
            barberId={selectedBarber.id}
            barberName={selectedBarber.displayName}
            onSuccess={handleEditSuccess}
          />
          <CancelAppointmentsDialog
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            barberId={selectedBarber.id}
            barberName={selectedBarber.displayName}
            onSuccess={handleEditSuccess}
          />
        </>
      )}
    </>
  );
}

