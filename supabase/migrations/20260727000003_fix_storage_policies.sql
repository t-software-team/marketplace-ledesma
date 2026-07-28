-- ============================================================
-- 20260727000003_fix_storage_policies.sql
-- Las políticas de storage.objects ejecutadas manualmente en remoto
-- comparaban shops.id contra storage.foldername(shops.name) --el
-- NOMBRE del comercio, no la ruta del archivo (storage.objects.name)--
-- lo que hacía que ningún owner pudiera subir nunca un archivo.
-- Convención de path: {shop_id}/archivo.ext
-- ============================================================

drop policy if exists "Owner and Admin read payment proofs" on storage.objects;
drop policy if exists "Owner and Admin read verification docs" on storage.objects;
drop policy if exists "Owner and Admin upload payment proofs" on storage.objects;
drop policy if exists "Owner and Admin upload verification docs" on storage.objects;
drop policy if exists "Owners and Admins upload public assets" on storage.objects;

create policy "Owners and Admins upload public assets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('shop-logos', 'shop-covers', 'product-images')
    and (
      exists (
        select 1 from public.shops s
        where s.id::text = (storage.foldername(objects.name))[1]
          and s.owner_id = auth.uid()
      )
      or public.is_superadmin()
    )
  );

create policy "Owners and Admins update public assets"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('shop-logos', 'shop-covers', 'product-images')
    and (
      exists (
        select 1 from public.shops s
        where s.id::text = (storage.foldername(objects.name))[1]
          and s.owner_id = auth.uid()
      )
      or public.is_superadmin()
    )
  );

create policy "Owners and Admins delete public assets"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('shop-logos', 'shop-covers', 'product-images')
    and (
      exists (
        select 1 from public.shops s
        where s.id::text = (storage.foldername(objects.name))[1]
          and s.owner_id = auth.uid()
      )
      or public.is_superadmin()
    )
  );

create policy "Owner and Admin read verification docs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'verification-docs'
    and (
      exists (
        select 1 from public.shops s
        where s.id::text = (storage.foldername(objects.name))[1]
          and s.owner_id = auth.uid()
      )
      or public.is_superadmin()
    )
  );

create policy "Owner and Admin upload verification docs"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'verification-docs'
    and exists (
      select 1 from public.shops s
      where s.id::text = (storage.foldername(objects.name))[1]
        and s.owner_id = auth.uid()
    )
  );

create policy "Owner and Admin read payment proofs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'payment-proofs'
    and (
      exists (
        select 1 from public.shops s
        where s.id::text = (storage.foldername(objects.name))[1]
          and s.owner_id = auth.uid()
      )
      or public.is_superadmin()
    )
  );

create policy "Owner and Admin upload payment proofs"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and exists (
      select 1 from public.shops s
      where s.id::text = (storage.foldername(objects.name))[1]
        and s.owner_id = auth.uid()
    )
  );
