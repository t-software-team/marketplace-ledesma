-- ============================================================
-- 20260727000009_add_audit_log_rpc.sql
-- RPC para que los Server Actions del superadmin dejen registro en
-- audit_log al aprobar/rechazar verificaciones, suscripciones y
-- reportes, sin necesitar policy de INSERT abierta.
-- ============================================================
create or replace function public.log_admin_action(
  p_action text,
  p_target_table text,
  p_target_id uuid,
  p_metadata jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'No autorizado';
  end if;

  insert into public.audit_log (actor_id, action, target_table, target_id, metadata)
  values (auth.uid(), p_action, p_target_table, p_target_id, p_metadata);
end;
$$;

revoke all on function public.log_admin_action(text, text, uuid, jsonb) from public;
grant execute on function public.log_admin_action(text, text, uuid, jsonb) to authenticated;
