-- ============================================================
-- 20260727000006_add_mark_notifications_read_rpc.sql
-- RPC para que el superadmin marque todas las admin_notifications
-- como leídas (no hay policy de UPDATE sobre esa tabla).
-- ============================================================
create or replace function public.mark_all_admin_notifications_read()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'No autorizado';
  end if;

  update public.admin_notifications
  set is_read = true
  where is_read = false;
end;
$$;

revoke all on function public.mark_all_admin_notifications_read() from public;
grant execute on function public.mark_all_admin_notifications_read() to authenticated;
