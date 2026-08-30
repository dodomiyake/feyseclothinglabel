-- Performance advisor: "Auth RLS Initialization Plan" — every policy below
-- called auth.uid()/is_admin()/is_production_staff()/is_assigned_to_enquiry()
-- bare, which Postgres re-evaluates once per row scanned rather than once
-- per query. Wrapping each call as (select ...) forces the planner to treat
-- it as an InitPlan (evaluated once, cached for the query), per Supabase's
-- documented fix. Pure performance change — every USING/WITH CHECK
-- expression below is otherwise identical to what 0002/0003/0004/0007
-- already defined, so no access-control behavior changes.
--
-- The advisor only flagged a subset of the public-schema policies, but the
-- same bare-call pattern exists in every policy that references these
-- functions (including the storage.objects policies from 0003, which
-- weren't flagged at all — schema not scanned by this particular lint).
-- Fixing all of them in one pass for consistency rather than leaving an
-- identical, merely-not-yet-flagged instance behind.
--
-- Also folds in the "Multiple Permissive Policies" finding for
-- bank_accounts and message_templates: both had a `for all` admin policy
-- stacked on top of a separate `for select` policy, so every authenticated
-- SELECT had to evaluate is_admin() twice across two permissive policies
-- Postgres then ORs together. Narrowed the admin policy to insert/update/
-- delete only, since the read policy's own `... or is_admin()` already
-- covers admin SELECT access.

-- ---------------------------------------------------------------------
-- audit_log
-- ---------------------------------------------------------------------
alter policy "audit_log_admin_select" on audit_log
  using ((select is_admin()));

-- ---------------------------------------------------------------------
-- bank_accounts — split admin "for all" into insert/update/delete so it
-- no longer overlaps bank_accounts_authenticated_read on SELECT.
-- ---------------------------------------------------------------------
drop policy "bank_accounts_admin_write" on bank_accounts;

create policy "bank_accounts_admin_insert" on bank_accounts for insert
  with check ((select is_admin()));

create policy "bank_accounts_admin_update" on bank_accounts for update
  using ((select is_admin())) with check ((select is_admin()));

create policy "bank_accounts_admin_delete" on bank_accounts for delete
  using ((select is_admin()));

alter policy "bank_accounts_authenticated_read" on bank_accounts
  using (active = true or (select is_admin()));

-- ---------------------------------------------------------------------
-- business_settings
-- ---------------------------------------------------------------------
alter policy "business_settings_admin_write" on business_settings
  using ((select is_admin()));

-- ---------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------
alter policy "customers_select_own_or_admin" on customers
  using (user_id = (select auth.uid()) or (select is_admin()));

alter policy "customers_update_own_or_admin" on customers
  using ((select is_admin()));

alter policy "customers_insert_self_or_admin" on customers
  with check ((select is_admin()));

-- ---------------------------------------------------------------------
-- enquiries
-- ---------------------------------------------------------------------
alter policy "enquiries_select" on enquiries
  using (
    (select is_admin())
    or exists (select 1 from customers c where c.id = enquiries.customer_id and c.user_id = (select auth.uid()))
    or (select is_assigned_to_enquiry(enquiries.id))
  );

alter policy "enquiries_insert" on enquiries
  with check (
    (select is_admin())
    or exists (select 1 from customers c where c.id = enquiries.customer_id and c.user_id = (select auth.uid()))
  );

alter policy "enquiries_update" on enquiries
  using ((select is_admin()));

-- ---------------------------------------------------------------------
-- enquiry_files
-- ---------------------------------------------------------------------
alter policy "enquiry_files_select" on enquiry_files
  using (
    (select is_admin())
    or exists (
      select 1 from enquiries e join customers c on c.id = e.customer_id
      where e.id = enquiry_files.enquiry_id and c.user_id = (select auth.uid())
    )
    or exists (
      select 1 from production_jobs pj join orders o on o.id = pj.order_id
      where o.enquiry_id = enquiry_files.enquiry_id and pj.assigned_to = (select auth.uid())
    )
  );

alter policy "enquiry_files_insert" on enquiry_files
  with check (
    (select is_admin())
    or exists (
      select 1 from enquiries e join customers c on c.id = e.customer_id
      where e.id = enquiry_files.enquiry_id and c.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- enquiry_revisions / status_events
-- ---------------------------------------------------------------------
alter policy "enquiry_revisions_select" on enquiry_revisions
  using (
    (select is_admin())
    or exists (
      select 1 from enquiries e join customers c on c.id = e.customer_id
      where e.id = enquiry_revisions.enquiry_id and c.user_id = (select auth.uid())
    )
  );

alter policy "enquiry_revisions_insert" on enquiry_revisions
  with check ((select is_admin()) or exists (
    select 1 from enquiries e join customers c on c.id = e.customer_id
    where e.id = enquiry_revisions.enquiry_id and c.user_id = (select auth.uid())
  ));

alter policy "status_events_select" on status_events
  using (
    (select is_admin())
    or (entity_type = 'enquiry' and exists (
      select 1 from enquiries e join customers c on c.id = e.customer_id
      where e.id = status_events.entity_id and c.user_id = (select auth.uid())
    ))
    or (entity_type = 'order' and exists (
      select 1 from orders o join enquiries e on e.id = o.enquiry_id join customers c on c.id = e.customer_id
      where o.id = status_events.entity_id and c.user_id = (select auth.uid())
    ))
  );

alter policy "status_events_admin_insert" on status_events
  with check ((select is_admin()));

-- ---------------------------------------------------------------------
-- whatsapp_notes
-- ---------------------------------------------------------------------
alter policy "whatsapp_notes_admin_all" on whatsapp_notes
  using ((select is_admin())) with check ((select is_admin()));

-- ---------------------------------------------------------------------
-- quotations
-- ---------------------------------------------------------------------
alter policy "quotations_select" on quotations
  using (
    (select is_admin())
    or (
      status <> 'draft'
      and exists (
        select 1 from enquiries e join customers c on c.id = e.customer_id
        where e.id = quotations.enquiry_id and c.user_id = (select auth.uid())
      )
    )
  );

alter policy "quotations_admin_write" on quotations with check ((select is_admin()));
alter policy "quotations_admin_update" on quotations using ((select is_admin()));

-- ---------------------------------------------------------------------
-- invoices
-- ---------------------------------------------------------------------
alter policy "invoices_select" on invoices
  using (
    (select is_admin())
    or exists (
      select 1 from enquiries e join customers c on c.id = e.customer_id
      where e.id = invoices.enquiry_id and c.user_id = (select auth.uid())
    )
  );

alter policy "invoices_admin_write" on invoices with check ((select is_admin()));
alter policy "invoices_admin_update" on invoices using ((select is_admin()));

-- ---------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------
alter policy "payments_select" on payments
  using (
    (select is_admin())
    or exists (
      select 1 from invoices i join enquiries e on e.id = i.enquiry_id join customers c on c.id = e.customer_id
      where i.id = payments.invoice_id and c.user_id = (select auth.uid())
    )
  );

alter policy "payments_customer_insert" on payments
  with check (
    (select is_admin())
    or exists (
      select 1 from invoices i join enquiries e on e.id = i.enquiry_id join customers c on c.id = e.customer_id
      where i.id = payments.invoice_id and c.user_id = (select auth.uid())
    )
  );

alter policy "payments_admin_update" on payments using ((select is_admin()));

-- ---------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------
alter policy "orders_select" on orders
  using (
    (select is_admin())
    or exists (
      select 1 from enquiries e join customers c on c.id = e.customer_id
      where e.id = orders.enquiry_id and c.user_id = (select auth.uid())
    )
    or exists (
      select 1 from production_jobs pj where pj.order_id = orders.id and pj.assigned_to = (select auth.uid())
    )
  );

alter policy "orders_admin_write" on orders with check ((select is_admin()));
alter policy "orders_admin_update" on orders using ((select is_admin()));

-- ---------------------------------------------------------------------
-- production_jobs / production_notes / production_photos / qc_checklists
-- ---------------------------------------------------------------------
alter policy "production_jobs_select" on production_jobs
  using ((select is_admin()) or assigned_to = (select auth.uid()));

alter policy "production_jobs_admin_insert" on production_jobs with check ((select is_admin()));

alter policy "production_jobs_update" on production_jobs
  using ((select is_admin()) or assigned_to = (select auth.uid()));

alter policy "production_notes_select" on production_notes
  using (
    (select is_admin())
    or exists (select 1 from production_jobs pj where pj.id = production_notes.production_job_id and pj.assigned_to = (select auth.uid()))
  );

alter policy "production_notes_insert" on production_notes
  with check (
    (select is_admin())
    or exists (select 1 from production_jobs pj where pj.id = production_notes.production_job_id and pj.assigned_to = (select auth.uid()))
  );

alter policy "production_photos_select" on production_photos
  using (
    (select is_admin())
    or exists (select 1 from production_jobs pj where pj.id = production_photos.production_job_id and pj.assigned_to = (select auth.uid()))
    or exists (
      select 1 from production_jobs pj
      join orders o on o.id = pj.order_id
      join enquiries e on e.id = o.enquiry_id
      join customers c on c.id = e.customer_id
      where pj.id = production_photos.production_job_id and c.user_id = (select auth.uid())
    )
  );

alter policy "production_photos_insert" on production_photos
  with check (
    (select is_admin())
    or exists (select 1 from production_jobs pj where pj.id = production_photos.production_job_id and pj.assigned_to = (select auth.uid()))
  );

alter policy "qc_checklists_select" on qc_checklists
  using (
    (select is_admin())
    or exists (select 1 from production_jobs pj where pj.id = qc_checklists.production_job_id and pj.assigned_to = (select auth.uid()))
  );

alter policy "qc_checklists_insert" on qc_checklists
  with check (
    (select is_admin())
    or exists (select 1 from production_jobs pj where pj.id = qc_checklists.production_job_id and pj.assigned_to = (select auth.uid()))
  );

alter policy "qc_checklists_update" on qc_checklists
  using (
    (select is_admin())
    or exists (select 1 from production_jobs pj where pj.id = qc_checklists.production_job_id and pj.assigned_to = (select auth.uid()))
  );

-- ---------------------------------------------------------------------
-- dispatches
-- ---------------------------------------------------------------------
alter policy "dispatches_select" on dispatches
  using (
    (select is_admin())
    or exists (
      select 1 from orders o join enquiries e on e.id = o.enquiry_id join customers c on c.id = e.customer_id
      where o.id = dispatches.order_id and c.user_id = (select auth.uid())
    )
    or exists (select 1 from production_jobs pj where pj.order_id = dispatches.order_id and pj.assigned_to = (select auth.uid()))
  );

alter policy "dispatches_admin_write" on dispatches with check ((select is_admin()));
alter policy "dispatches_admin_update" on dispatches using ((select is_admin()));

-- ---------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------
alter policy "notifications_select_own" on notifications
  using (user_id = (select auth.uid()));

alter policy "notifications_mark_read_own" on notifications
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
alter policy "profiles_select_own_or_admin" on profiles
  using (id = (select auth.uid()) or (select is_admin()));

alter policy "profiles_update_own_or_admin" on profiles
  using ((select is_admin()));

alter policy "profiles_admin_insert" on profiles
  with check ((select is_admin()));

-- ---------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------
alter policy "products_public_read" on products
  using (active = true or (select is_admin()));

alter policy "products_admin_write" on products with check ((select is_admin()));
alter policy "products_admin_update" on products using ((select is_admin()));
alter policy "products_admin_delete" on products using ((select is_admin()));

-- ---------------------------------------------------------------------
-- message_templates — same "for all" + "for select" overlap as
-- bank_accounts, same fix.
-- ---------------------------------------------------------------------
drop policy "message_templates_admin_write" on message_templates;

create policy "message_templates_admin_insert" on message_templates for insert
  with check ((select is_admin()));

create policy "message_templates_admin_update" on message_templates for update
  using ((select is_admin())) with check ((select is_admin()));

create policy "message_templates_admin_delete" on message_templates for delete
  using ((select is_admin()));

alter policy "message_templates_staff_read" on message_templates
  using ((select is_admin()) or (select is_production_staff()));

-- =========================================================================
-- storage.objects — same bare-call pattern, not flagged by this advisor
-- run (schema not scanned) but identical fix applies.
-- =========================================================================
alter policy "artwork_select" on storage.objects
  using (
    bucket_id = 'artwork'
    and (
      (select is_admin())
      or exists (
        select 1 from enquiries e join customers c on c.id = e.customer_id
        where e.id::text = (storage.foldername(name))[1] and c.user_id = (select auth.uid())
      )
      or exists (
        select 1 from production_jobs pj join orders o on o.id = pj.order_id
        where o.enquiry_id::text = (storage.foldername(name))[1] and pj.assigned_to = (select auth.uid())
      )
    )
  );

alter policy "artwork_insert" on storage.objects
  with check (
    bucket_id = 'artwork'
    and (
      (select is_admin())
      or exists (
        select 1 from enquiries e join customers c on c.id = e.customer_id
        where e.id::text = (storage.foldername(name))[1] and c.user_id = (select auth.uid())
      )
    )
  );

alter policy "artwork_delete" on storage.objects
  using (
    bucket_id = 'artwork'
    and (
      (select is_admin())
      or exists (
        select 1 from enquiries e join customers c on c.id = e.customer_id
        where e.id::text = (storage.foldername(name))[1] and c.user_id = (select auth.uid()) and e.status = 'draft'
      )
    )
  );

alter policy "payment_evidence_select" on storage.objects
  using (
    bucket_id = 'payment-evidence'
    and (
      (select is_admin())
      or exists (
        select 1 from invoices i join enquiries e on e.id = i.enquiry_id join customers c on c.id = e.customer_id
        where i.id::text = (storage.foldername(name))[1] and c.user_id = (select auth.uid())
      )
    )
  );

alter policy "payment_evidence_insert" on storage.objects
  with check (
    bucket_id = 'payment-evidence'
    and (
      (select is_admin())
      or exists (
        select 1 from invoices i join enquiries e on e.id = i.enquiry_id join customers c on c.id = e.customer_id
        where i.id::text = (storage.foldername(name))[1] and c.user_id = (select auth.uid())
      )
    )
  );

alter policy "production_photos_bucket_select" on storage.objects
  using (
    bucket_id = 'production-photos'
    and (
      (select is_admin())
      or exists (
        select 1 from production_jobs pj where pj.id::text = (storage.foldername(name))[1] and pj.assigned_to = (select auth.uid())
      )
      or exists (
        select 1 from production_jobs pj
        join orders o on o.id = pj.order_id
        join enquiries e on e.id = o.enquiry_id
        join customers c on c.id = e.customer_id
        where pj.id::text = (storage.foldername(name))[1] and c.user_id = (select auth.uid())
      )
    )
  );

alter policy "production_photos_bucket_insert" on storage.objects
  with check (
    bucket_id = 'production-photos'
    and (
      (select is_admin())
      or exists (
        select 1 from production_jobs pj where pj.id::text = (storage.foldername(name))[1] and pj.assigned_to = (select auth.uid())
      )
    )
  );

alter policy "dispatch_proof_select" on storage.objects
  using (
    bucket_id = 'dispatch-proof'
    and (
      (select is_admin())
      or exists (
        select 1 from orders o join enquiries e on e.id = o.enquiry_id join customers c on c.id = e.customer_id
        where o.id::text = (storage.foldername(name))[1] and c.user_id = (select auth.uid())
      )
    )
  );

alter policy "dispatch_proof_insert" on storage.objects
  with check (bucket_id = 'dispatch-proof' and (select is_admin()));

alter policy "business_assets_admin_insert" on storage.objects
  with check (bucket_id = 'business-assets' and (select is_admin()));

alter policy "business_assets_admin_update" on storage.objects
  using (bucket_id = 'business-assets' and (select is_admin()));
