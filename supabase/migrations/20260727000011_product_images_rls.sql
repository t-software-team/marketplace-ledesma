-- ============================================================
-- 20260727000011_product_images_rls.sql
-- product_images tenía RLS habilitado pero CERO políticas (la
-- migración inicial abortó antes de llegar a esta sección la
-- primera vez, y el SQL manual original tampoco las incluía).
-- Con RLS on y sin policies, Postgres deniega todo por default:
-- esto bloqueaba silenciosamente la lectura de imágenes en la
-- ficha de producto y el perfil de shop (consultas directas, no
-- vía get_products_feed que es security definer), y bloqueaba
-- por completo el nuevo flujo de múltiples imágenes por producto.
-- ============================================================

create policy "product_images_select_visible"
  on public.product_images for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.products p
      join public.shops s on s.id = p.shop_id
      where p.id = product_images.product_id
        and (
          (p.is_active = true and s.is_active = true and s.is_paused = false and s.deleted_at is null)
          or s.owner_id = auth.uid()
          or public.is_superadmin()
        )
    )
  );

create policy "product_images_insert_shop_owner"
  on public.product_images for insert
  to authenticated
  with check (
    exists (
      select 1 from public.products p
      join public.shops s on s.id = p.shop_id
      where p.id = product_images.product_id
        and s.owner_id = auth.uid()
    )
  );

create policy "product_images_update_shop_owner"
  on public.product_images for update
  to authenticated
  using (
    exists (
      select 1 from public.products p
      join public.shops s on s.id = p.shop_id
      where p.id = product_images.product_id
        and s.owner_id = auth.uid()
    )
  );

create policy "product_images_delete_shop_owner"
  on public.product_images for delete
  to authenticated
  using (
    exists (
      select 1 from public.products p
      join public.shops s on s.id = p.shop_id
      where p.id = product_images.product_id
        and s.owner_id = auth.uid()
    )
  );
