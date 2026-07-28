-- ============================================================
-- 20260728000011_rate_limiting.sql
-- Rate limiting genérico basado en Postgres (sin infra nueva).
-- El "actor" lo resuelve el server action de confianza: user id
-- si está logueado, o IP si es anónimo (ej. reportar un comercio
-- no requiere cuenta). check_rate_limit cuenta eventos recientes
-- y registra el nuevo intento de forma atómica.
-- ============================================================
create table public.rate_limit_events (
  id bigint generated always as identity primary key,
  actor text not null,
  action text not null,
  created_at timestamptz not null default now()
);

create index idx_rate_limit_events_actor_action
  on public.rate_limit_events (actor, action, created_at desc);

-- Housekeeping: nada de RLS de lectura pública — solo accesible
-- vía la función security definer de abajo.
alter table public.rate_limit_events enable row level security;

create or replace function public.check_rate_limit(
  p_actor text,
  p_action text,
  p_max_count integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  delete from public.rate_limit_events
  where action = p_action
    and created_at < now() - (p_window_seconds || ' seconds')::interval
    and random() < 0.05;

  select count(*) into v_count
  from public.rate_limit_events
  where actor = p_actor
    and action = p_action
    and created_at > now() - (p_window_seconds || ' seconds')::interval;

  if v_count >= p_max_count then
    return false;
  end if;

  insert into public.rate_limit_events (actor, action) values (p_actor, p_action);
  return true;
end;
$$;

revoke all on function public.check_rate_limit(text, text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, text, integer, integer) to anon, authenticated;
