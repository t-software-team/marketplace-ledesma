"use client";

import { useState, useTransition } from "react";
import { Calendar as CalendarIcon, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { requestAppointment } from "@/lib/turnos/actions";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAvailableSlotsForDates } from "@/hooks/use-turnos";

const TIMEZONE = "America/Argentina/Buenos_Aires";
const PHONE_MIN_DIGITS = 8;

interface Slot {
  starts_at: string;
  ends_at: string;
}

interface BookingSectionProps {
  shopId: string;
}

function todayInTimezone(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function nextDates(count: number): string[] {
  const dates: string[] = [];
  const today = new Date(`${todayInTimezone()}T12:00:00`);
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function formatDateLabel(dateStr: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TIMEZONE,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${dateStr}T12:00:00`));
}

function formatSlotLabel(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatSummary(dateStr: string, slot: Slot) {
  const label = new Intl.DateTimeFormat("es-AR", {
    timeZone: TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${dateStr}T12:00:00`));
  return `${label} a las ${formatSlotLabel(slot.starts_at)}hs`;
}

function isAfternoon(iso: string) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      hour: "2-digit",
      hour12: false,
    }).format(new Date(iso)),
  );
  return hour >= 13;
}

function digitsCount(value: string) {
  return value.replace(/\D/g, "").length;
}

export function BookingSection({ shopId }: BookingSectionProps) {
  const dates = nextDates(14);
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [requested, setRequested] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isMobile = useIsMobile();

  // Precarga disponibilidad de los 14 días (cacheada por React Query) para
  // mostrar el punto de "hay turnos" en cada fecha sin re-pedir al volver a
  // seleccionar un día ya visitado.
  const slotQueries = useAvailableSlotsForDates(shopId, dates);
  const selectedIndex = dates.indexOf(selectedDate);
  const selectedQuery = slotQueries[selectedIndex];

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
  }

  const slots = selectedQuery?.data ?? [];
  const loadingSlots = selectedQuery?.isLoading ?? true;
  const slotsErrored = selectedQuery?.isError ?? false;
  const morningSlots = slots.filter((s) => !isAfternoon(s.starts_at));
  const afternoonSlots = slots.filter((s) => isAfternoon(s.starts_at));

  const phoneDigits = digitsCount(phone);
  const phoneValid = phoneDigits >= PHONE_MIN_DIGITS;
  const canSubmit =
    Boolean(selectedSlot) && name.trim().length > 0 && phoneValid;

  function handleSubmit() {
    setPhoneTouched(true);
    if (!selectedSlot || !name.trim() || !phoneValid) return;

    startTransition(async () => {
      const result = await requestAppointment(
        shopId,
        selectedSlot.starts_at,
        name,
        phone,
        email,
      );
      if (result.error) {
        toast.add({
          title: "No pudimos reservar",
          description: result.error,
          type: "error",
        });
      } else {
        setRequested(true);
      }
    });
  }

  if (requested) {
    return (
      <Card className="animate-in fade-in zoom-in-95 rounded-xl ring-1 ring-foreground/10 duration-300">
        <CardContent className="py-6 text-center">
          <p className="font-medium">¡Solicitud enviada!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            El comercio va a confirmar tu turno a la brevedad. Tu horario queda
            reservado por 3 horas mientras tanto.
          </p>
        </CardContent>
      </Card>
    );
  }

  const contactForm = (
    <>
      <p className="text-sm font-medium text-foreground">
        Vas a reservar el{" "}
        {selectedSlot && formatSummary(selectedDate, selectedSlot)}
      </p>
      <div>
        <label htmlFor="booking-name" className="sr-only">
          Nombre
        </label>
        <Input
          id="booking-name"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-11"
        />
      </div>
      <div>
        <label htmlFor="booking-phone" className="sr-only">
          Teléfono
        </label>
        <Input
          id="booking-phone"
          placeholder="Teléfono"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => setPhoneTouched(true)}
          type="tel"
          inputMode="tel"
          required
          className="h-11"
          aria-invalid={phoneTouched && !phoneValid}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {phoneTouched && !phoneValid ? (
            <span className="text-destructive">
              Ingresá un teléfono válido, ej: 3886528023
            </span>
          ) : (
            "Lo usamos para avisarte por WhatsApp cuando confirmen tu turno."
          )}
        </p>
      </div>
      <div>
        <label htmlFor="booking-email" className="sr-only">
          Email (opcional)
        </label>
        <Input
          id="booking-email"
          type="email"
          inputMode="email"
          placeholder="Email (opcional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11"
        />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={isPending || !canSubmit}
        className="h-11 w-full"
      >
        {isPending ? "Enviando..." : "Solicitar turno"}
      </Button>
    </>
  );

  return (
    <>
      <Card className="rounded-xl ring-1 ring-foreground/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="size-4" aria-hidden />
            Reservar turno
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2">
            {dates.map((date, index) => {
              const hasAvailability =
                (slotQueries[index]?.data?.length ?? 0) > 0;
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => handleSelectDate(date)}
                  className={cn(
                    "relative flex min-h-11 shrink-0 snap-start flex-col items-center justify-center rounded-xl border px-3.5 py-2 text-sm capitalize transition-colors",
                    selectedDate === date
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface text-muted-foreground hover:text-foreground",
                  )}
                >
                  {formatDateLabel(date)}
                  {hasAvailability && (
                    <span
                      className={cn(
                        "absolute top-1.5 right-1.5 size-1.5 rounded-full",
                        selectedDate === date
                          ? "bg-primary-foreground"
                          : "bg-primary",
                      )}
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>

          {loadingSlots ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-20 rounded-xl" />
              ))}
            </div>
          ) : slotsErrored ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <WifiOff className="size-4 shrink-0" aria-hidden />
              No pudimos cargar los horarios. Revisá tu conexión e intentá de
              nuevo.
            </p>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No quedan horarios libres para este día. Probá con otra fecha.
            </p>
          ) : (
            <div className="space-y-3">
              {morningSlots.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Mañana
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {morningSlots.map((slot) => (
                      <button
                        key={slot.starts_at}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={cn(
                          "min-h-11 min-w-16 rounded-xl border px-3 py-2 text-sm transition-colors",
                          selectedSlot?.starts_at === slot.starts_at
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-surface text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {formatSlotLabel(slot.starts_at)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {afternoonSlots.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Tarde
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {afternoonSlots.map((slot) => (
                      <button
                        key={slot.starts_at}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={cn(
                          "min-h-11 min-w-16 rounded-xl border px-3 py-2 text-sm transition-colors",
                          selectedSlot?.starts_at === slot.starts_at
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-surface text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {formatSlotLabel(slot.starts_at)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedSlot && !isMobile && (
            <div className="animate-in slide-in-from-top-2 fade-in space-y-3 border-t border-border pt-4 duration-200">
              {contactForm}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={isMobile && Boolean(selectedSlot)}
        onOpenChange={(open) => !open && setSelectedSlot(null)}
      >
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto rounded-t-2xl"
        >
          <SheetHeader>
            <SheetTitle>Confirmá tu turno</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 px-4 pb-6">
            {selectedSlot && contactForm}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
