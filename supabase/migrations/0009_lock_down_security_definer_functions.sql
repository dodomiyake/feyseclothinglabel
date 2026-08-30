-- Supabase's security advisor flagged every SECURITY DEFINER helper as
-- directly callable via PostgREST RPC (/rest/v1/rpc/<fn>) by anon and/or
-- authenticated — that's just Postgres's default "grant execute to public
-- on every new function", never reviewed against what each one actually
-- needs. Tightened per-function below, after checking every RLS policy and
-- app call site that references each one (none of these are ever called
-- directly by app code — only from within RLS policies and one column
-- default).
--
-- next_document_number() gets an extra fix, not just a grant change: as a
-- column default it's evaluated under the admin's own authenticated
-- session (see createQuotationAction), so `authenticated` genuinely needs
-- EXECUTE — but that also meant any authenticated customer, or previously
-- even an anonymous visitor with no login at all, could call
-- /rest/v1/rpc/next_document_number directly and burn through the
-- enquiry/quotation/invoice/order number sequence with zero authorization
-- check anywhere. Since a plain grant can't distinguish "admin's own
-- session" from "any authenticated user", the authorization now lives
-- inside the function itself.

create or replace function next_document_number(p_prefix text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year int := extract(year from now());
  v_value int;
begin
  if not (is_admin() or auth.role() = 'service_role') then
    raise exception 'not authorized';
  end if;

  insert into document_sequences (prefix, year, next_value)
  values (p_prefix, v_year, 2)
  on conflict (prefix) do update
    set next_value = case when document_sequences.year = v_year then document_sequences.next_value + 1 else 2 end,
        year = v_year
  returning (case when next_value = 2 and year = v_year then 1 else next_value - 1 end) into v_value;

  return p_prefix || '-' || v_year || '-' || lpad(v_value::text, 4, '0');
end;
$$;

revoke execute on function next_document_number(text) from public;
grant execute on function next_document_number(text) to authenticated, service_role;

-- Used only inside RLS policies that apply to signed-in users
-- (message_templates_staff_read, enquiries_select) — anon never needs it.
revoke execute on function is_production_staff() from public;
grant execute on function is_production_staff() to authenticated, service_role;

revoke execute on function is_assigned_to_enquiry(uuid) from public;
grant execute on function is_assigned_to_enquiry(uuid) to authenticated, service_role;

-- Trigger-only function (trg_on_auth_user_created) — Postgres fires
-- triggers regardless of the invoking session's EXECUTE grant on the
-- trigger function, so it never needed to be callable directly at all.
revoke execute on function handle_new_user() from public;

-- Not referenced by any RLS policy or app code — dead weight, no reason
-- for it to be publicly callable.
revoke execute on function current_profile_role() from public;

-- is_admin() is intentionally left as-is: products_public_read and
-- business_settings_public_read are read by signed-out visitors on the
-- public marketing pages, and both policy bodies call is_admin() as part
-- of their USING clause — anon genuinely needs EXECUTE for those queries
-- to evaluate at all.
