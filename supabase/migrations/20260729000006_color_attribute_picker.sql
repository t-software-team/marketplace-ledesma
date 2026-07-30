-- Colors become a real color-picker attribute (hex swatches) instead of
-- plain text chips, and Concesionaria also gets a color attribute.

alter table public.category_attributes drop constraint if exists category_attributes_type_check;
alter table public.category_attributes add constraint category_attributes_type_check
  check (type in ('select', 'multiselect', 'text', 'number', 'multicolor'));

update public.category_attributes
set
  type = 'multicolor',
  options = '[
    {"label": "Negro", "hex": "#000000"},
    {"label": "Blanco", "hex": "#ffffff"},
    {"label": "Gris", "hex": "#9ca3af"},
    {"label": "Azul", "hex": "#3b82f6"},
    {"label": "Rojo", "hex": "#ef4444"},
    {"label": "Verde", "hex": "#22c55e"},
    {"label": "Amarillo", "hex": "#eab308"},
    {"label": "Rosa", "hex": "#ec4899"},
    {"label": "Beige", "hex": "#d6c7a1"},
    {"label": "Marrón", "hex": "#78350f"}
  ]'::jsonb
where category_id = 'a2222222-2222-2222-2222-222222222222' and key = 'color';

insert into public.category_attributes (category_id, key, label, type, options, sort_order) values
  ('c3333333-3333-3333-3333-333333333333', 'color', 'Color', 'multicolor', '[
    {"label": "Negro", "hex": "#000000"},
    {"label": "Blanco", "hex": "#ffffff"},
    {"label": "Gris", "hex": "#9ca3af"},
    {"label": "Plateado", "hex": "#c0c0c0"},
    {"label": "Azul", "hex": "#3b82f6"},
    {"label": "Rojo", "hex": "#ef4444"},
    {"label": "Verde", "hex": "#22c55e"},
    {"label": "Dorado", "hex": "#d4af37"},
    {"label": "Marrón", "hex": "#78350f"}
  ]'::jsonb, 5)
on conflict (category_id, key) do nothing;
