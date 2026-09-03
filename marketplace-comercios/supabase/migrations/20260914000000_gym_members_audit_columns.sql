-- Attribution for member altas/bajas, matching the pattern already used by
-- gym_check_ins.created_by and gym_memberships.created_by (renovaciones ya
-- quedan cubiertas ahí). gym_members solo tenía is_archived sin registrar
-- quién lo creó ni quién dio de baja.
alter table public.gym_members
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists archived_by uuid references auth.users(id) on delete set null,
  add column if not exists archived_at timestamptz;
