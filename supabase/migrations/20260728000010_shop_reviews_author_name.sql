-- ============================================================
-- 20260728000010_shop_reviews_author_name.sql
-- getShopReviews traía profiles.full_name vía join normal, pero
-- la RLS de profiles solo permite leer el propio perfil
-- (auth.uid() = id), así que el nombre de otros usuarios volvía
-- null y el frontend mostraba "Usuario" para todos. Se agrega una
-- RPC security definer que expone SOLO id/rating/comment/fecha/
-- nombre de las reseñas públicas de un shop, sin abrir el resto
-- del perfil (teléfono, ciudad, etc.) a cualquiera.
-- ============================================================
create or replace function public.get_shop_reviews(p_shop_id uuid)
returns table (
  id uuid,
  rating smallint,
  comment text,
  created_at timestamptz,
  client_id uuid,
  client_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    sr.id,
    sr.rating,
    sr.comment,
    sr.created_at,
    sr.client_id,
    coalesce(p.full_name, 'Usuario') as client_name
  from public.shop_reviews sr
  left join public.profiles p on p.id = sr.client_id
  where sr.shop_id = p_shop_id
  order by sr.created_at desc
  limit 50;
$$;

revoke all on function public.get_shop_reviews(uuid) from public;
grant execute on function public.get_shop_reviews(uuid) to anon, authenticated;
