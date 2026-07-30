alter table public.shop_promotions
  add column if not exists text_size text not null default 'md'
    check (text_size in ('sm', 'md', 'lg')),
  add column if not exists text_color text not null default '#ffffff',
  add column if not exists bg_color text not null default '#000000';
