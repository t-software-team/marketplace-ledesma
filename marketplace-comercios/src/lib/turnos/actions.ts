"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/server/supabase-service-role";
import { sendEmail } from "@/lib/email/client";
import { appointmentConfirmedEmail } from "@/lib/email/templates";
import {
  buildAppointmentWhatsAppLink,
  formatWhenText,
} from "@/lib/turnos/whatsapp";

export type TurnoActionState = {
  error: string | null;
};

const TURNOS_PATH = "/mi-tienda/turnos";

// Mensajes que los RPCs de turnos levantan a propósito con RAISE EXCEPTION en
// español, pensados para mostrarse tal cual al usuario. Cualquier otro error
// de Postgres (conexión, timeout, etc.) cae al fallback genérico en vez de
// filtrar detalle interno.
const KNOWN_RPC_ERRORS = new Set([
  "El nombre es obligatorio",
  "El teléfono es obligatorio",
  "Este comercio no tiene turnos habilitados",
  "Ese horario ya no está disponible",
  "Ya tenés solicitudes de turno pendientes en este comercio",
  "Configurá primero la duración de turno para este comercio",
  "Ya hay un turno en ese horario",
  "Este turno ya no está pendiente de confirmación",
  "La reserva de este horario venció; el cliente debe solicitarlo de nuevo",
]);

function friendlyRpcError(message: string | undefined, fallback: string) {
  return message && KNOWN_RPC_ERRORS.has(message) ? message : fallback;
}

function revalidateTurnos() {
  revalidatePath(TURNOS_PATH);
}

export async function requestAppointment(
  shopId: string,
  startsAtIso: string,
  customerName: string,
  customerPhone: string,
  customerEmail?: string,
): Promise<TurnoActionState> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("request_appointment", {
    p_shop_id: shopId,
    p_starts_at: startsAtIso,
    p_customer_name: customerName,
    p_customer_phone: customerPhone,
    p_customer_email: customerEmail || undefined,
  });

  if (error) {
    console.error("requestAppointment: fallo al solicitar turno", {
      shopId,
      startsAtIso,
      error,
    });
    return {
      error: friendlyRpcError(error.message, "No pudimos reservar ese turno"),
    };
  }

  return { error: null };
}

export async function confirmAppointment(
  appointmentId: string,
): Promise<TurnoActionState & { whatsappLink: string | null }> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("confirm_appointment", {
    p_appointment_id: appointmentId,
  });

  if (error) {
    console.error("confirmAppointment: fallo al confirmar", {
      appointmentId,
      error,
    });
    return { error: "No pudimos confirmar el turno", whatsappLink: null };
  }

  let whatsappLink: string | null = null;

  try {
    const service = createServiceRoleClient();
    const { data: appointment } = await service
      .from("appointments")
      .select(
        "starts_at, customer_email, customer_phone, shop_id, shops ( name )",
      )
      .eq("id", appointmentId)
      .maybeSingle();

    if (appointment) {
      const shopName = appointment.shops?.name ?? "el comercio";

      if (appointment.customer_email) {
        const { subject, html } = appointmentConfirmedEmail(
          shopName,
          formatWhenText(appointment.starts_at),
        );
        await sendEmail(appointment.customer_email, subject, html);
      }

      if (appointment.customer_phone) {
        whatsappLink = buildAppointmentWhatsAppLink(
          shopName,
          appointment.customer_phone,
          appointment.starts_at,
        );
      }
    }
  } catch (error) {
    console.error("confirmAppointment: fallo al notificar (best effort)", {
      appointmentId,
      error,
    });
  }

  revalidateTurnos();

  return { error: null, whatsappLink };
}

export async function rejectAppointment(
  appointmentId: string,
): Promise<TurnoActionState> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("reject_appointment", {
    p_appointment_id: appointmentId,
  });

  if (error) {
    console.error("rejectAppointment: fallo al rechazar", {
      appointmentId,
      error,
    });
    return { error: "No pudimos rechazar el turno" };
  }

  revalidateTurnos();
  return { error: null };
}

export async function createManualAppointment(
  shopId: string,
  startsAtIso: string,
  customerName: string,
  customerPhone?: string,
  customerEmail?: string,
): Promise<TurnoActionState> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("create_manual_appointment", {
    p_shop_id: shopId,
    p_starts_at: startsAtIso,
    p_customer_name: customerName,
    p_customer_phone: customerPhone || undefined,
    p_customer_email: customerEmail || undefined,
  });

  if (error) {
    console.error("createManualAppointment: fallo al crear turno manual", {
      shopId,
      error,
    });
    return {
      error: friendlyRpcError(error.message, "No pudimos crear el turno"),
    };
  }

  revalidateTurnos();
  return { error: null };
}

export async function blockSlot(
  shopId: string,
  startsAtIso: string,
  endsAtIso: string,
): Promise<TurnoActionState> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("block_slot", {
    p_shop_id: shopId,
    p_starts_at: startsAtIso,
    p_ends_at: endsAtIso,
  });

  if (error) {
    console.error("blockSlot: fallo al bloquear horario", { shopId, error });
    return { error: "No pudimos bloquear ese horario" };
  }

  revalidateTurnos();
  return { error: null };
}

export async function rescheduleAppointment(
  appointmentId: string,
  newStartsAtIso: string,
): Promise<TurnoActionState> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("reschedule_appointment", {
    p_appointment_id: appointmentId,
    p_new_starts_at: newStartsAtIso,
  });

  if (error) {
    console.error("rescheduleAppointment: fallo al reprogramar", {
      appointmentId,
      error,
    });
    return {
      error: friendlyRpcError(error.message, "No pudimos reprogramar el turno"),
    };
  }

  revalidateTurnos();
  return { error: null };
}

export async function cancelAppointment(
  appointmentId: string,
): Promise<TurnoActionState> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("cancel_appointment", {
    p_appointment_id: appointmentId,
  });

  if (error) {
    console.error("cancelAppointment: fallo al cancelar", {
      appointmentId,
      error,
    });
    return { error: "No pudimos cancelar el turno" };
  }

  revalidateTurnos();
  return { error: null };
}

export async function completeAppointment(
  appointmentId: string,
): Promise<TurnoActionState> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("complete_appointment", {
    p_appointment_id: appointmentId,
  });

  if (error) {
    console.error("completeAppointment: fallo al marcar completado", {
      appointmentId,
      error,
    });
    return { error: "No pudimos marcar el turno como completado" };
  }

  revalidateTurnos();
  return { error: null };
}

export async function markNoShow(
  appointmentId: string,
): Promise<TurnoActionState> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("mark_no_show", {
    p_appointment_id: appointmentId,
  });

  if (error) {
    console.error("markNoShow: fallo al marcar no-show", {
      appointmentId,
      error,
    });
    return { error: "No pudimos marcar el turno como no-show" };
  }

  revalidateTurnos();
  return { error: null };
}

export async function setBookingSettings(
  shopId: string,
  slotDurationMinutes: number,
  weeklyHours: Record<string, { open: string; close: string }[]>,
  isEnabled: boolean,
): Promise<TurnoActionState> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("set_booking_settings", {
    p_shop_id: shopId,
    p_slot_duration_minutes: slotDurationMinutes,
    p_weekly_hours: weeklyHours as never,
    p_is_enabled: isEnabled,
  });

  if (error) {
    console.error("setBookingSettings: fallo al guardar configuración", {
      shopId,
      error,
    });
    return { error: "No pudimos guardar la configuración" };
  }

  revalidatePath(TURNOS_PATH);
  revalidatePath("/mi-tienda/turnos/configuracion");
  return { error: null };
}
