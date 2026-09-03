-- Stock informativo por producto: NULL = sin control de stock, >=0 = cantidad
-- disponible. Sin gating por plan, sin decremento automático (no hay checkout).

alter table "public"."products"
  add column "stock" integer;

alter table "public"."products"
  add constraint "products_stock_check" check (("stock" is null) or ("stock" >= 0));
