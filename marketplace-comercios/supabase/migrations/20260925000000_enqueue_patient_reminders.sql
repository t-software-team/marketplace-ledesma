-- Cron de recordatorios genéricos: mismo patrón EXACTO que
-- enqueue_treatment_reminders (20260922000000_treatment_reminders.sql):
-- UPDATE...RETURNING atómico, ventana 3-5 días, SECURITY DEFINER,
-- service_role only. Función nueva — no reemplaza ninguna existente, no
-- aplica el riesgo de overload huérfano de CREATE OR REPLACE + parámetro
-- nuevo sobre una función ya publicada.

CREATE OR REPLACE FUNCTION "public"."enqueue_patient_reminders"()
RETURNS TABLE (
  "id" uuid,
  "shop_name" text,
  "patient_name" text,
  "owner_email" text,
  "owner_name" text,
  "label" text,
  "due_at" timestamptz
)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  return query
  update public.patient_reminders r
  set reminder_sent_at = now()
  from public.patients p
  join public.shops s on s.id = p.shop_id
  where r.patient_id = p.id
    and r.reminder_sent_at is null
    and p.owner_email is not null
    and r.due_at between now() + interval '3 days' and now() + interval '5 days'
  returning r.id, s.name, p.name, p.owner_email, p.owner_name, r.label, r.due_at;
end;
$$;

ALTER FUNCTION "public"."enqueue_patient_reminders"() OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."enqueue_patient_reminders"() TO "service_role";
