"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  CalendarDays,
  List,
  MessageCircle,
  MoreHorizontal,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/components/ui/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  confirmAppointment,
  rejectAppointment,
  blockSlot,
  rescheduleAppointment,
  cancelAppointment,
  completeAppointment,
  markNoShow,
} from "@/lib/turnos/actions";
import type { AppointmentRow } from "@/lib/turnos/queries";
import { toWhatsAppNumber } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ManualAppointmentDialog } from "./manual-appointment-dialog";

const TIMEZONE = "America/Argentina/Buenos_Aires";
const HISTORY_STATUSES = new Set([
  "completed",
  "cancelled",
  "rejected",
  "no_show",
]);

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function dateKeyInTimezone(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function todayKey() {
  return dateKeyInTimezone(new Date().toISOString());
}

function HoldCountdown({ holdExpiresAt }: { holdExpiresAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const remainingMs = new Date(holdExpiresAt).getTime() - now;

  if (remainingMs <= 0) {
    return (
      <span className="text-xs font-medium text-destructive">Hold vencido</span>
    );
  }

  const minutes = Math.floor(remainingMs / 60_000);
  const label =
    minutes >= 60
      ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
      : `${minutes}m`;

  return (
    <span
      className={cn(
        "text-xs font-medium",
        minutes <= 30 ? "text-destructive" : "text-muted-foreground",
      )}
    >
      Vence en {label}
    </span>
  );
}

type Tab = "pending" | "today" | "history";
type ViewMode = "list" | "calendar";

const TABS: { value: Tab; label: string }[] = [
  { value: "pending", label: "Pendientes" },
  { value: "today", label: "Hoy" },
  { value: "history", label: "Historial" },
];

interface AppointmentsTableProps {
  shopId: string;
  appointments: AppointmentRow[];
  isVeterinaria?: boolean;
}

export function AppointmentsTable({
  shopId,
  appointments,
  isVeterinaria = false,
}: AppointmentsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [manualOpen, setManualOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("pending");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const pendingCount = useMemo(
    () => appointments.filter((a) => a.status === "pending").length,
    [appointments],
  );

  const daysWithAppointments = useMemo(
    () =>
      appointments.map(
        (a) => new Date(`${dateKeyInTimezone(a.starts_at)}T12:00:00`),
      ),
    [appointments],
  );

  const filtered = useMemo(() => {
    if (viewMode === "calendar") {
      const dayKey = dateKeyInTimezone(selectedDay.toISOString());
      return appointments.filter(
        (a) => dateKeyInTimezone(a.starts_at) === dayKey,
      );
    }

    const today = todayKey();
    if (tab === "pending")
      return appointments.filter((a) => a.status === "pending");
    if (tab === "today")
      return appointments.filter(
        (a) => dateKeyInTimezone(a.starts_at) === today,
      );
    return appointments.filter(
      (a) =>
        HISTORY_STATUSES.has(a.status) ||
        dateKeyInTimezone(a.starts_at) < today,
    );
  }, [appointments, tab, viewMode, selectedDay]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`appointments-${shopId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "appointments",
          filter: `shop_id=eq.${shopId}`,
        },
        () => {
          toast.add({ title: "Nueva solicitud de turno", type: "success" });
          router.refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
          filter: `shop_id=eq.${shopId}`,
        },
        () => {
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [shopId, router]);

  function refresh(message: string, error: string | null) {
    if (error) {
      toast.add({
        title: "No pudimos completar la acción",
        description: error,
        type: "error",
      });
    } else {
      toast.add({ title: message, type: "success" });
      router.refresh();
    }
  }

  function handleConfirm(id: string) {
    startTransition(async () => {
      const result = await confirmAppointment(id);
      refresh("Turno confirmado", result.error);
      if (result.whatsappLink) {
        window.open(result.whatsappLink, "_blank", "noopener,noreferrer");
      }
    });
  }

  function handleReject(id: string) {
    startTransition(async () => {
      const result = await rejectAppointment(id);
      refresh("Turno rechazado", result.error);
    });
  }

  function handleCancel(id: string) {
    startTransition(async () => {
      const result = await cancelAppointment(id);
      refresh("Turno cancelado", result.error);
    });
  }

  function handleComplete(id: string) {
    startTransition(async () => {
      const result = await completeAppointment(id);
      refresh("Turno marcado como completado", result.error);
    });
  }

  function handleNoShow(id: string) {
    startTransition(async () => {
      const result = await markNoShow(id);
      refresh("Turno marcado como no-show", result.error);
    });
  }

  function handleBlockSubmit(formData: FormData) {
    const startsAt = formData.get("starts_at") as string;
    const endsAt = formData.get("ends_at") as string;

    startTransition(async () => {
      const result = await blockSlot(
        shopId,
        new Date(startsAt).toISOString(),
        new Date(endsAt).toISOString(),
      );
      refresh("Horario bloqueado", result.error);
      if (!result.error) setBlockOpen(false);
    });
  }

  function handleRescheduleSubmit(formData: FormData) {
    if (!rescheduleId) return;
    const startsAt = formData.get("starts_at") as string;

    startTransition(async () => {
      const result = await rescheduleAppointment(
        rescheduleId,
        new Date(startsAt).toISOString(),
      );
      refresh("Turno reprogramado", result.error);
      if (!result.error) setRescheduleId(null);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === "list" && (
            <div className="flex gap-1 rounded-xl bg-secondary p-1">
              {TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTab(t.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    tab === t.value
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                  {t.value === "pending" && pendingCount > 0 && (
                    <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            size="icon"
            aria-label={viewMode === "list" ? "Ver calendario" : "Ver lista"}
            onClick={() =>
              setViewMode(viewMode === "list" ? "calendar" : "list")
            }
          >
            {viewMode === "list" ? (
              <CalendarDays className="size-4" aria-hidden />
            ) : (
              <List className="size-4" aria-hidden />
            )}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setManualOpen(true)}>
            Alta manual
          </Button>
          <Button variant="outline" onClick={() => setBlockOpen(true)}>
            Bloquear horario
          </Button>
        </div>
      </div>

      <div
        className={cn(
          viewMode === "calendar" &&
            "flex flex-col gap-4 md:flex-row md:items-start",
        )}
      >
        {viewMode === "calendar" && (
          <div className="space-y-2 md:w-[320px] md:shrink-0">
            <Calendar
              mode="single"
              selected={selectedDay}
              onSelect={(date) => date && setSelectedDay(date)}
              modifiers={{ hasAppointments: daysWithAppointments }}
              modifiersClassNames={{
                hasAppointments:
                  "after:absolute after:bottom-1 after:size-1 after:rounded-full after:bg-primary",
              }}
              classNames={{ root: "w-full" }}
              className="w-full rounded-xl bg-surface p-3 ring-1 ring-foreground/10 [--cell-size:--spacing(9)]"
            />
            <p className="px-1 text-xs text-muted-foreground">
              El punto violeta marca los días que tienen turnos. Elegí un día
              para ver el detalle.
            </p>
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          {viewMode === "calendar" && (
            <p className="text-sm font-medium capitalize">
              Turnos del{" "}
              {new Intl.DateTimeFormat("es-AR", {
                timeZone: TIMEZONE,
                weekday: "long",
                day: "numeric",
                month: "long",
              }).format(selectedDay)}
            </p>
          )}

          {filtered.length === 0 ? (
            <EmptyState
              message={
                viewMode === "calendar"
                  ? "No hay turnos para el día seleccionado."
                  : tab === "pending"
                    ? "No hay turnos pendientes de confirmar."
                    : tab === "today"
                      ? "No hay turnos para hoy."
                      : "Todavía no hay turnos en el historial."
              }
            />
          ) : (
            <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((appointment) => {
                    const needsAction =
                      appointment.status === "confirmed" &&
                      new Date(appointment.starts_at).getTime() < now;

                    return (
                      <TableRow
                        key={appointment.id}
                        className={cn(needsAction && "bg-warning/5")}
                      >
                        <TableCell>
                          {formatDateTime(appointment.starts_at)}
                          {appointment.status === "pending" &&
                            appointment.hold_expires_at && (
                              <div>
                                <HoldCountdown
                                  holdExpiresAt={appointment.hold_expires_at}
                                />
                              </div>
                            )}
                        </TableCell>
                        <TableCell>
                          {appointment.customer_name ?? (
                            <span className="text-muted-foreground">—</span>
                          )}
                          {appointment.customer_phone && (
                            <div className="text-xs text-muted-foreground">
                              {appointment.customer_phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <StatusBadge status={appointment.status} />
                            {needsAction && (
                              <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-medium text-warning-foreground">
                                Requiere acción
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {appointment.origin}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {appointment.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  disabled={isPending}
                                  onClick={() => handleConfirm(appointment.id)}
                                >
                                  Confirmar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isPending}
                                  onClick={() => handleReject(appointment.id)}
                                >
                                  Rechazar
                                </Button>
                              </>
                            )}
                            {appointment.status === "confirmed" && (
                              <>
                                {appointment.customer_phone && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1"
                                    render={
                                      <a
                                        href={`https://wa.me/${toWhatsAppNumber(appointment.customer_phone)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      />
                                    }
                                    nativeButton={false}
                                  >
                                    <MessageCircle
                                      className="size-3.5"
                                      aria-hidden
                                    />
                                    WhatsApp
                                  </Button>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        aria-label="Más acciones"
                                      />
                                    }
                                    nativeButton={true}
                                  >
                                    <MoreHorizontal
                                      className="size-4"
                                      aria-hidden
                                    />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setRescheduleId(appointment.id)
                                      }
                                    >
                                      Reprogramar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={isPending}
                                      onClick={() =>
                                        handleComplete(appointment.id)
                                      }
                                    >
                                      Marcar completado
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={isPending}
                                      onClick={() =>
                                        handleNoShow(appointment.id)
                                      }
                                    >
                                      Marcar no-show
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={isPending}
                                      onClick={() =>
                                        handleCancel(appointment.id)
                                      }
                                      className="text-destructive"
                                    >
                                      Cancelar turno
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <ManualAppointmentDialog
        shopId={shopId}
        open={manualOpen}
        onOpenChange={setManualOpen}
        onSuccess={(message) => refresh(message, null)}
        onError={(message) => refresh("", message)}
        isVeterinaria={isVeterinaria}
      />

      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear horario</DialogTitle>
          </DialogHeader>
          <form action={handleBlockSubmit} className="space-y-3">
            <Input
              type="datetime-local"
              name="starts_at"
              required
              aria-label="Desde"
            />
            <Input
              type="datetime-local"
              name="ends_at"
              required
              aria-label="Hasta"
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando..." : "Bloquear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(rescheduleId)}
        onOpenChange={(open) => !open && setRescheduleId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprogramar turno</DialogTitle>
          </DialogHeader>
          <form action={handleRescheduleSubmit} className="space-y-3">
            <Input
              type="datetime-local"
              name="starts_at"
              required
              aria-label="Nueva fecha y hora"
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando..." : "Reprogramar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
