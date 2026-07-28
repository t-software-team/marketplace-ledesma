-- ============================================================
-- 20260728000003_product_videos.sql
-- Un video corto opcional por producto/servicio (no una galería:
-- una sola URL, como un "reel"). Bucket propio con límites server-
-- side (20MB, solo mp4/webm/mov) además de la validación client-
-- side, y RLS con el mismo patrón owner-scoped que product-images.
-- ============================================================

alter table public.products
  add column if not exists video_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-videos',
  'product-videos',
  true,
  20971520, -- 20MB
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
set file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "product_videos_select_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-videos');

create policy "product_videos_insert_shop_owner"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-videos'
    and exists (
      select 1 from public.shops s
      where s.id::text = (storage.foldername(objects.name))[1]
        and s.owner_id = auth.uid()
    )
  );

create policy "product_videos_update_shop_owner"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-videos'
    and exists (
      select 1 from public.shops s
      where s.id::text = (storage.foldername(objects.name))[1]
        and s.owner_id = auth.uid()
    )
  );

create policy "product_videos_delete_shop_owner"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-videos'
    and exists (
      select 1 from public.shops s
      where s.id::text = (storage.foldername(objects.name))[1]
        and s.owner_id = auth.uid()
    )
  );
