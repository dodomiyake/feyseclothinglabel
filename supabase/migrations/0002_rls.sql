-- Row Level Security policies.
-- Customers can only reach their own records. Production staff can only reach
-- production data for jobs assigned to them. Admins have full access.
-- notifications / audit_log / secure_links have NO client-facing policies —
-- they are written and read only through trusted server code using the
-- Supabase service-role key, which bypasses RLS entirely.

alter table profiles enable row level security;
alter table customers enable row level security;
alter table business_settings enable row level security;
alter table bank_accounts enable row level security;
alter table products enable row level security;
alter table message_templates enable row level security;
alter table enquiries enable row level security;
alter table enquiry_files enable row level security;
alter table enquiry_revisions enable row level security;
alter table whatsapp_notes enable row level security;
alter table status_events enable row level security;
alter table quotations enable row level security;
alter table invoices enable row level security;
alter table payments enable row level security;
alter table orders enable row level security;
alter table production_jobs enable row level security;
alter table production_notes enable row level security;
alter table production_photos enable row level security;
alter table qc_checklists enable row level security;
alter table dispatches enable row level security;
alter table secure_links enable row level security;
alter table notifications enable row level security;
alter table audit_log enable row level security;
alter table document_sequences enable row level security;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create policy "profiles_select_own_or_admin" on profiles for select
  using (id = auth.uid() or is_admin());

create policy "profiles_update_own_or_admin" on profiles for update
  using (id = auth.uid() or is_admin());

create policy "profiles_admin_insert" on profiles for insert
  with check (is_admin());

-- ---------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------
create policy "customers_select_own_or_admin" on customers for select
  using (user_id = auth.uid() or is_admin());

create policy "customers_update_own_or_admin" on customers for update
  using (user_id = auth.uid() or is_admin());

create policy "customers_insert_self_or_admin" on customers for insert
  with check (user_id = auth.uid() or is_admin());

-- ---------------------------------------------------------------------
-- business_settings / bank_accounts / products (reference data)
-- ---------------------------------------------------------------------
create policy "business_settings_public_read" on business_settings for select
  using (true);

create policy "business_settings_admin_write" on business_settings for update
  using (is_admin());

create policy "bank_accounts_authenticated_read" on bank_accounts for select
  to authenticated
  using (active = true or is_admin());

create policy "bank_accounts_admin_write" on bank_accounts for all
  using (is_admin()) with check (is_admin());

create policy "products_public_read" on products for select
  using (active = true or is_admin());

create policy "products_admin_write" on products for insert with check (is_admin());
create policy "products_admin_update" on products for update using (is_admin());
create policy "products_admin_delete" on products for delete using (is_admin());

create policy "message_templates_staff_read" on message_templates for select
  to authenticated
  using (is_admin() or is_production_staff());

create policy "message_templates_admin_write" on message_templates for all
  using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- enquiries
-- ---------------------------------------------------------------------
create policy "enquiries_select" on enquiries for select
  using (
    is_admin()
    or exists (select 1 from customers c where c.id = enquiries.customer_id and c.user_id = auth.uid())
    or exists (
      select 1 from production_jobs pj
      join orders o on o.id = pj.order_id
      where o.enquiry_id = enquiries.id and pj.assigned_to = auth.uid()
    )
  );

create policy "enquiries_insert" on enquiries for insert
  with check (
    is_admin()
    or exists (select 1 from customers c where c.id = enquiries.customer_id and c.user_id = auth.uid())
  );

create policy "enquiries_update" on enquiries for update
  using (
    is_admin()
    or (
      status = 'draft'
      and exists (select 1 from customers c where c.id = enquiries.customer_id and c.user_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- enquiry_files
-- ---------------------------------------------------------------------
create policy "enquiry_files_select" on enquiry_files for select
  using (
    is_admin()
    or exists (
      select 1 from enquiries e join customers c on c.id = e.customer_id
      where e.id = enquiry_files.enquiry_id and c.user_id = auth.uid()
    )
    or exists (
      select 1 from production_jobs pj join orders o on o.id = pj.order_id
      where o.enquiry_id = enquiry_files.enquiry_id and pj.assigned_to = auth.uid()
    )
  );

create policy "enquiry_files_insert" on enquiry_files for insert
  with check (
    is_admin()
    or exists (
      select 1 from enquiries e join customers c on c.id = e.customer_id
      where e.id = enquiry_files.enquiry_id and c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- enquiry_revisions / status_events (customer-visible history)
-- ---------------------------------------------------------------------
create policy "enquiry_revisions_select" on enquiry_revisions for select
  using (
    is_admin()
    or exists (
      select 1 from enquiries e join customers c on c.id = e.customer_id
      where e.id = enquiry_revisions.enquiry_id and c.user_id = auth.uid()
    )
  );

create policy "enquiry_revisions_insert" on enquiry_revisions for insert
  with check (is_admin() or exists (
    select 1 from enquiries e join customers c on c.id = e.customer_id
    where e.id = enquiry_revisions.enquiry_id and c.user_id = auth.uid()
  ));

create policy "status_events_select" on status_events for select
  using (
    is_admin()
    or (entity_type = 'enquiry' and exists (
      select 1 from enquiries e join customers c on c.id = e.customer_id
      where e.id = status_events.entity_id and c.user_id = auth.uid()
    ))
    or (entity_type = 'order' and exists (
      select 1 from orders o join enquiries e on e.id = o.enquiry_id join customers c on c.id = e.customer_id
      where o.id = status_events.entity_id and c.user_id = auth.uid()
    ))
  );

create policy "status_events_admin_insert" on status_events for insert
  with check (is_admin());

-- ---------------------------------------------------------------------
-- whatsapp_notes — internal, admin only
-- ---------------------------------------------------------------------
create policy "whatsapp_notes_admin_all" on whatsapp_notes for all
  using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- quotations
-- ---------------------------------------------------------------------
create policy "quotations_select" on quotations for select
  using (
    is_admin()
    or (
      status <> 'draft'
      and exists (
        select 1 from enquiries e join customers c on c.id = e.customer_id
        where e.id = quotations.enquiry_id and c.user_id = auth.uid()
      )
    )
  );

create policy "quotations_admin_write" on quotations for insert with check (is_admin());
create policy "quotations_admin_update" on quotations for update using (is_admin());

create policy "quotations_customer_respond" on quotations for update
  using (
    status = 'sent'
    and exists (
      select 1 from enquiries e join customers c on c.id = e.customer_id
      where e.id = quotations.enquiry_id and c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- invoices
-- ---------------------------------------------------------------------
create policy "invoices_select" on invoices for select
  using (
    is_admin()
    or exists (
      select 1 from enquiries e join customers c on c.id = e.customer_id
      where e.id = invoices.enquiry_id and c.user_id = auth.uid()
    )
  );

create policy "invoices_admin_write" on invoices for insert with check (is_admin());
create policy "invoices_admin_update" on invoices for update using (is_admin());

-- ---------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------
create policy "payments_select" on payments for select
  using (
    is_admin()
    or exists (
      select 1 from invoices i join enquiries e on e.id = i.enquiry_id join customers c on c.id = e.customer_id
      where i.id = payments.invoice_id and c.user_id = auth.uid()
    )
  );

create policy "payments_customer_insert" on payments for insert
  with check (
    is_admin()
    or exists (
      select 1 from invoices i join enquiries e on e.id = i.enquiry_id join customers c on c.id = e.customer_id
      where i.id = payments.invoice_id and c.user_id = auth.uid()
    )
  );

create policy "payments_admin_update" on payments for update using (is_admin());

-- ---------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------
create policy "orders_select" on orders for select
  using (
    is_admin()
    or exists (
      select 1 from enquiries e join customers c on c.id = e.customer_id
      where e.id = orders.enquiry_id and c.user_id = auth.uid()
    )
    or exists (
      select 1 from production_jobs pj where pj.order_id = orders.id and pj.assigned_to = auth.uid()
    )
  );

create policy "orders_admin_write" on orders for insert with check (is_admin());
create policy "orders_admin_update" on orders for update using (is_admin());

-- ---------------------------------------------------------------------
-- production_jobs / production_notes / production_photos / qc_checklists
-- ---------------------------------------------------------------------
create policy "production_jobs_select" on production_jobs for select
  using (is_admin() or assigned_to = auth.uid());

create policy "production_jobs_admin_insert" on production_jobs for insert with check (is_admin());

create policy "production_jobs_update" on production_jobs for update
  using (is_admin() or assigned_to = auth.uid());

create policy "production_notes_select" on production_notes for select
  using (
    is_admin()
    or exists (select 1 from production_jobs pj where pj.id = production_notes.production_job_id and pj.assigned_to = auth.uid())
  );

create policy "production_notes_insert" on production_notes for insert
  with check (
    is_admin()
    or exists (select 1 from production_jobs pj where pj.id = production_notes.production_job_id and pj.assigned_to = auth.uid())
  );

create policy "production_photos_select" on production_photos for select
  using (
    is_admin()
    or exists (select 1 from production_jobs pj where pj.id = production_photos.production_job_id and pj.assigned_to = auth.uid())
    or exists (
      select 1 from production_jobs pj
      join orders o on o.id = pj.order_id
      join enquiries e on e.id = o.enquiry_id
      join customers c on c.id = e.customer_id
      where pj.id = production_photos.production_job_id and c.user_id = auth.uid()
    )
  );

create policy "production_photos_insert" on production_photos for insert
  with check (
    is_admin()
    or exists (select 1 from production_jobs pj where pj.id = production_photos.production_job_id and pj.assigned_to = auth.uid())
  );

create policy "qc_checklists_select" on qc_checklists for select
  using (
    is_admin()
    or exists (select 1 from production_jobs pj where pj.id = qc_checklists.production_job_id and pj.assigned_to = auth.uid())
  );

create policy "qc_checklists_insert" on qc_checklists for insert
  with check (
    is_admin()
    or exists (select 1 from production_jobs pj where pj.id = qc_checklists.production_job_id and pj.assigned_to = auth.uid())
  );

create policy "qc_checklists_update" on qc_checklists for update
  using (
    is_admin()
    or exists (select 1 from production_jobs pj where pj.id = qc_checklists.production_job_id and pj.assigned_to = auth.uid())
  );

-- ---------------------------------------------------------------------
-- dispatches
-- ---------------------------------------------------------------------
create policy "dispatches_select" on dispatches for select
  using (
    is_admin()
    or exists (
      select 1 from orders o join enquiries e on e.id = o.enquiry_id join customers c on c.id = e.customer_id
      where o.id = dispatches.order_id and c.user_id = auth.uid()
    )
    or exists (select 1 from production_jobs pj where pj.order_id = dispatches.order_id and pj.assigned_to = auth.uid())
  );

create policy "dispatches_admin_write" on dispatches for insert with check (is_admin());
create policy "dispatches_admin_update" on dispatches for update using (is_admin());

create policy "dispatches_customer_confirm" on dispatches for update
  using (
    exists (
      select 1 from orders o join enquiries e on e.id = o.enquiry_id join customers c on c.id = e.customer_id
      where o.id = dispatches.order_id and c.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- notifications — self read/mark-as-read only; writes are service-role only
-- ---------------------------------------------------------------------
create policy "notifications_select_own" on notifications for select
  using (user_id = auth.uid());

create policy "notifications_mark_read_own" on notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- audit_log: admin read only, no client insert policy (service-role writes only)
create policy "audit_log_admin_select" on audit_log for select
  using (is_admin());

-- document_sequences: no client policies (accessed only via next_document_number())

-- secure_links: no client policies at all — verified only via service-role server code
