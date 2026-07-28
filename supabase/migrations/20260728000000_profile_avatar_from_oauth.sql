-- ============================================================
-- 20260728000000_profile_avatar_from_oauth.sql
-- handle_new_user() nunca guardaba avatar_url, aunque Google (y
-- otros proveedores OAuth) lo mandan en raw_user_meta_data. El
-- header siempre mostraba las iniciales en vez de la foto real.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  return new;
end;
$$;

-- Backfill para usuarios que ya se registraron antes de este fix.
update public.profiles p
set avatar_url = coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
from auth.users u
where u.id = p.id
  and p.avatar_url is null
  and coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture') is not null;
