-- Superadmin dashboard needs to read shop_contacts across all shops (recent
-- WhatsApp contacts feed). Previously only the client who made the contact
-- could select their own rows.

create policy "shop_contacts_select_superadmin"
  on public.shop_contacts for select
  to authenticated
  using (public.is_superadmin());

-- The existing products_select policy only exposes active products from
-- active/non-paused shops. The admin dashboard's product counts and live
-- feed need to see everything regardless of shop/product status.

create policy "products_select_superadmin"
  on public.products for select
  to authenticated
  using (public.is_superadmin());
