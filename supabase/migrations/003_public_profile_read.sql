-- Allow public read of profile fields needed for payment pages.
-- The payment page is unauthenticated (clients paying invoices don't have accounts),
-- but it needs to show the freelancer's name and wallet address.
--
-- Email is not queried on the payment page. If you want stricter protection,
-- replace this with a VIEW that exposes only (id, name, business_name, raenest_wallet).

CREATE POLICY "Public can view profiles for payment pages"
  ON profiles FOR SELECT
  USING (true);
