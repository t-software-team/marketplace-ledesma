-- Shop admins can suggest a new category/subcategory that doesn't exist yet.
-- It goes to a pending queue for superadmin review instead of becoming
-- public immediately, to avoid duplicates and keep the catalog clean.

create table if not exists public.category_suggestions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  parent_id uuid references public.categories(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  resulting_category_id uuid references public.categories(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists category_suggestions_status_idx on public.category_suggestions(status);

alter table public.category_suggestions enable row level security;

drop policy if exists category_suggestions_select on public.category_suggestions;
create policy category_suggestions_select on public.category_suggestions
  for select
  using (
    exists (select 1 from shops s where s.id = category_suggestions.shop_id and s.owner_id = auth.uid())
    or is_superadmin()
  );

drop policy if exists category_suggestions_insert_shop_owner on public.category_suggestions;
create policy category_suggestions_insert_shop_owner on public.category_suggestions
  for insert
  with check (
    exists (select 1 from shops s where s.id = category_suggestions.shop_id and s.owner_id = auth.uid())
  );

drop policy if exists category_suggestions_update_superadmin on public.category_suggestions;
create policy category_suggestions_update_superadmin on public.category_suggestions
  for update
  using (is_superadmin())
  with check (is_superadmin());

-- Normalizes text for duplicate comparisons: lowercase, unaccented,
-- non-alphanumeric collapsed, so "Lavadero", "lavaderos" and "LAVADERO "
-- all compare equal.
create or replace function public.normalize_category_text(p_text text)
returns text
language sql
immutable
as $$
  select trim(regexp_replace(lower(public.immutable_unaccent(p_text)), '[^a-z0-9]+', ' ', 'g'));
$$;

create or replace function public.approve_category_suggestion(p_suggestion_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_suggestion record;
  v_slug text;
  v_new_id uuid;
begin
  if not public.is_superadmin() then
    raise exception 'Solo el superadmin puede aprobar categorías';
  end if;

  select * into v_suggestion from category_suggestions where id = p_suggestion_id and status = 'pending';
  if v_suggestion is null then
    raise exception 'Sugerencia no encontrada o ya revisada';
  end if;

  v_slug := regexp_replace(public.normalize_category_text(v_suggestion.name), '\s+', '-', 'g');
  if v_suggestion.parent_id is not null then
    v_slug := (select slug from categories where id = v_suggestion.parent_id) || '-' || v_slug;
  end if;

  insert into categories (name, slug, parent_id, is_active, created_by)
  values (v_suggestion.name, v_slug, v_suggestion.parent_id, true, auth.uid())
  returning id into v_new_id;

  update category_suggestions
  set status = 'approved', resulting_category_id = v_new_id, reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_suggestion_id;

  return v_new_id;
end;
$$;

create or replace function public.reject_category_suggestion(p_suggestion_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Solo el superadmin puede rechazar categorías';
  end if;

  update category_suggestions
  set status = 'rejected', rejection_reason = p_reason, reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_suggestion_id and status = 'pending';
end;
$$;
