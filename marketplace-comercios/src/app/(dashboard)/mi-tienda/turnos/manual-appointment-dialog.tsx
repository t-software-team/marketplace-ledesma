"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createManualAppointment } from "@/lib/turnos/actions";
import {
  searchPatientsByOwnerAction,
} from "@/lib/patients/actions";
import type { PatientOwnerSuggestion } from "@/lib/patients/queries";
import { cn } from "@/lib/utils";
import { useAvailableSlots, type AvailableSlot } from "@/hooks/use-turnos";

const TIMEZONE = "America/Argentina/Buenos_Aires";

type Slot = AvailableSlot;

interface ManualAppointmentDialogProps {
  shopId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  isVeterinaria?: boolean;
}

function todayInTimezone() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function formatSlotLabel(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function ManualAppointmentDialog({
  shopId,
  open,
  onOpenChange,
  onSuccess,
  onError,
  isVeterinaria = false,
}: ManualAppointmentDialogProps) {
  const [date, setDate] = useState(todayInTimezone());
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [customTime, setCustomTime] = useState(false);
  const [customStartsAt, setCustomStartsAt] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [patientId, setPatientId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PatientOwnerSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const slotsQuery = useAvailableSlots(shopId, date);
  const slots = open ? (slotsQuery.data ?? []) : [];
  const loadingSlots = open && slotsQuery.isLoading;

  function handleOwnerQueryChange(value: string) {
    setPatientId(null);
    if (!isVeterinaria) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await searchPatientsByOwnerAction(shopId, value);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    }, 400);
  }

  function handleSelectSuggestion(patient: PatientOwnerSuggestion) {
    setPatientId(patient.id);
    setName(patient.owner_name ?? name);
    setPhone(patient.owner_phone ?? phone);
    setEmail(patient.owner_email ?? email);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleDateChange(nextDate: string) {
    setDate(nextDate);
    setSelectedSlot(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setDate(todayInTimezone());
      setSelectedSlot(null);
      setCustomTime(false);
      setCustomStartsAt("");
      setName("");
      setPhone("");
      setEmail("");
      setPatientId(null);
      setSuggestions([]);
      setShowSuggestions(false);
    }
    onOpenChange(nextOpen);
  }

  const startsAtIso = customTime
    ? customStartsAt
      ? new Date(customStartsAt).toISOString()
      : null
    : (selectedSlot?.starts_at ?? null);

  const canSubmit = Boolean(startsAtIso) && name.trim().length > 0;

  function handleSubmit() {
    if (!startsAtIso || !name.trim()) return;

    startTransition(async () => {
      const result = await createManualAppointment(
        shopId,
        startsAtIso,
        name,
        phone,
        email,
        patientId,
      );
      if (result.error) {
        onError(result.error);
      } else {
        onSuccess("Turno manual creado");
        handleOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Alta manual de turno</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            aria-label="Fecha"
          />

          {!customTime && (
            <>
              {loadingSlots ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-16 rounded-lg" />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay horarios libres configurados para este día.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => (
                    <button
                      key={slot.starts_at}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        "min-h-9 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                        selectedSlot?.starts_at === slot.starts_at
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-surface text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {formatSlotLabel(slot.starts_at)}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => setCustomTime((v) => !v)}
            className="text-xs font-medium text-primary hover:underline"
          >
            {customTime
              ? "Elegir un horario disponible"
              : "Cargar otro horario (walk-in, excepción)"}
          </button>

          {customTime && (
            <div className="space-y-2">
              <Input
                type="datetime-local"
                value={customStartsAt}
                onChange={(e) => setCustomStartsAt(e.target.value)}
                aria-label="Fecha y hora personalizada"
              />
              <p className="flex items-start gap-1.5 text-xs text-warning-foreground">
                <AlertTriangle
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden
                />
                Este horario puede caer fuera de la disponibilidad configurada.
                Se va a crear igual, como excepción.
              </p>
            </div>
          )}

          <div className="space-y-3 border-t border-border pt-3">
            {patientId && (
              <p className="text-xs font-medium text-primary">
                Paciente vinculado ✓
              </p>
            )}
            <div className="relative">
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  handleOwnerQueryChange(e.target.value);
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() =>
                  setTimeout(() => setShowSuggestions(false), 150)
                }
                placeholder="Nombre del cliente"
                required
              />
              {isVeterinaria && showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-surface shadow-md">
                  {suggestions.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectSuggestion(s)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      >
                        <span className="font-medium">
                          {s.owner_name ?? "Sin nombre"}
                        </span>
                        {s.owner_phone && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {s.owner_phone}
                          </span>
                        )}
                        <span className="block text-xs text-muted-foreground">
                          Paciente: {s.name}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Input
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                handleOwnerQueryChange(e.target.value);
              }}
              placeholder="Teléfono (opcional)"
            />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (opcional)"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isPending || !canSubmit}>
            {isPending ? "Guardando..." : "Crear turno"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
