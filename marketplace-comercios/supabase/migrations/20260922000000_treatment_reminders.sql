-- Módulo de Tratamientos (Fase 4 de "Veterinaria"): RPC de cron para
-- recordatorios de próximas dosis. `reminder_sent_at` ya existe en
-- treatment_applications desde 20260920000000_treatments.sql — no hace falta
-- ALTER, solo la RPC de enqueue. Mismo patrón que
-- `enqueue_appointment_reminders` (20260814000000_turnos.sql): UPDATE...
-- RETURNING atómico, SECURITY DEFINER, service_role only.

CREATE OR REPLACE FUNCTION "public"."enqueue_treatment_reminders"()
RETURNS TABLE (
  "id" uuid,
  "shop_name" text,
  "patient_name" text,
  "owner_email" text,
  "owner_name" text,
  "dose_label" text,
  "next_due_at" timestamptz
)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  return query
  update public.treatment_applications a
  set reminder_sent_at = now()
  from public.patients p
  join public.shops s on s.id = p.shop_id
  left join public.treatment_template_doses d on d.id = a.template_dose_id
  where a.patient_id = p.id
    and a.reminder_sent_at is null
    and p.owner_email is not null
    and a.next_due_at between now() + interval '3 days' and now() + interval '5 days'
  returning a.id, s.name, p.name, p.owner_email, p.owner_name, d.label, a.next_due_at;
end;
$$;

ALTER FUNCTION "public"."enqueue_treatment_reminders"() OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."enqueue_treatment_reminders"() TO "service_role";
