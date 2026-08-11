-- Soporte para comercios mayoristas/importadores: flag a nivel tienda +
-- cantidad mínima de pedido y precio mayorista opcionales a nivel producto.

alter table "public"."shops"
  add column "is_wholesale" boolean default false not null;

alter table "public"."products"
  add column "min_order_qty" integer,
  add column "wholesale_price" numeric(10,2);

alter table "public"."products"
  add constraint "products_min_order_qty_check" check (("min_order_qty" is null) or ("min_order_qty" > 0));

alter table "public"."products"
  add constraint "products_wholesale_price_check" check (("wholesale_price" is null) or ("wholesale_price" >= 0));
