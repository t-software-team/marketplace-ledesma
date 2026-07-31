-- ============================================================
-- 20260731000001_shop_landing_video.sql
-- Alternativa a pegar un link de YouTube/Vimeo en el video de la
-- landing de la tienda (Plan Ilimitado): permite subir un archivo
-- corto directo. Mismo patrón que product-videos (20MB, mp4/webm/mov,
-- RLS owner-scoped por shopId en el primer segmento del path).
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shop-landing-videos',
  'shop-landing-videos',
  true,
  20971520, -- 20MB
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
set file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "shop_landing_videos_select_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'shop-landing-videos');

create policy "shop_landing_videos_insert_shop_owner"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'shop-landing-videos'
    and exists (
      select 1 from public.shops s
      where s.id::text = (storage.foldername(objects.name))[1]
        and s.owner_id = auth.uid()
    )
  );

create policy "shop_landing_videos_update_shop_owner"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'shop-landing-videos'
    and exists (
      select 1 from public.shops s
      where s.id::text = (storage.foldername(objects.name))[1]
        and s.owner_id = auth.uid()
    )
  );

create policy "shop_landing_videos_delete_shop_owner"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'shop-landing-videos'
    and exists (
      select 1 from public.shops s
      where s.id::text = (storage.foldername(objects.name))[1]
        and s.owner_id = auth.uid()
    )
  );
