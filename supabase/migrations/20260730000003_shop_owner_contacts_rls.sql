-- Shop owners need to read their own shop's contacts to power the
-- "WhatsApp contacts this week" trend chart in /mi-tienda. Previously only
-- the client who initiated the contact could select their own rows
-- (shop_contacts_select_own), and whatsapp_clicks was just a counter with
-- no owner-visible detail behind it.

create policy "shop_contacts_select_shop_owner"
  on public.shop_contacts for select
  to authenticated
  using (
    exists (
      select 1 from public.shops s
      where s.id = shop_contacts.shop_id
        and s.owner_id = auth.uid()
    )
  );
