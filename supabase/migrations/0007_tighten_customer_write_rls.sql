-- Tighten customer-facing write policies down to admin-only.
--
-- Every mutation this app performs goes through a "use server" action using
-- the service-role client (see src/lib/actions/*.ts), never the signed-in
-- user's own Supabase session — that's been verified against every write
-- path in the codebase. These policies granted the customer's own session
-- direct write access anyway (reachable by anyone with a valid customer
-- login using the public Supabase client, entirely outside the app's own
-- validation), and RLS is row-scoped, not column-scoped, so the "only your
-- own row" checks didn't stop a customer from:
--   - self-promoting to admin: UPDATE profiles SET role='admin' WHERE
--     id=auth.uid() (profiles_update_own_or_admin had no column restriction
--     at all — the most severe finding here)
--   - tampering with their own quotation's price while it stayed 'sent',
--     then accepting it normally through the UI
--   - forging a payments row with status='confirmed', bypassing admin
--     review entirely
--   - writing arbitrary columns on their own dispatch record
--
-- Since no code relies on the customer branches, removing them has zero
-- functional impact and closes all of the above.

alter policy "profiles_update_own_or_admin" on profiles
  using (is_admin());

alter policy "customers_update_own_or_admin" on customers
  using (is_admin());

alter policy "customers_insert_self_or_admin" on customers
  with check (is_admin());

alter policy "enquiries_insert" on enquiries
  with check (is_admin());

alter policy "enquiries_update" on enquiries
  using (is_admin());

alter policy "enquiry_files_insert" on enquiry_files
  with check (is_admin());

alter policy "enquiry_revisions_insert" on enquiry_revisions
  with check (is_admin());

alter policy "payments_customer_insert" on payments
  with check (is_admin());

-- Redundant with quotations_admin_update / dispatches_admin_update once the
-- customer branch is gone, so drop rather than narrow to an admin-only
-- duplicate of an existing policy.
drop policy if exists "quotations_customer_respond" on quotations;
drop policy if exists "dispatches_customer_confirm" on dispatches;
