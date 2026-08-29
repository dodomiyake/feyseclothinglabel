-- Fix infinite RLS recursion between `enquiries` and `orders`.
--
-- `enquiries_select` and `orders_select` each contained a raw cross-table
-- subquery into the other (production staff assignment on one side, order
-- ownership on the other). Because those subqueries are not security
-- definer, Postgres re-applies RLS to the referenced table while planning
-- the policy, so evaluating either policy re-triggers the other and Postgres
-- reports "infinite recursion detected in policy for relation" (42P17) for
-- ANY authenticated non-admin read of `enquiries` — this is what made a
-- freshly-submitted enquiry appear to sign customers out: the confirmation
-- page's `.data` read silently returned null on the error and redirected to
-- /sign-in.
--
-- Fix: move the "is this user assigned production staff for this enquiry"
-- check into a SECURITY DEFINER function, same pattern as is_admin() /
-- is_production_staff() — it bypasses RLS on the tables it queries
-- internally, so it can't re-trigger the caller's policy.

create or replace function public.is_assigned_to_enquiry(p_enquiry_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from production_jobs pj
    join orders o on o.id = pj.order_id
    where o.enquiry_id = p_enquiry_id and pj.assigned_to = auth.uid()
  );
$$;

drop policy if exists "enquiries_select" on enquiries;
create policy "enquiries_select" on enquiries for select
  using (
    is_admin()
    or exists (select 1 from customers c where c.id = enquiries.customer_id and c.user_id = auth.uid())
    or is_assigned_to_enquiry(enquiries.id)
  );
