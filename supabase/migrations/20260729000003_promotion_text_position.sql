alter table public.shop_promotions
  add column if not exists text_position text not null default 'bottom'
    check (text_position in ('top', 'center', 'bottom'));
