-- Supabase's performance advisor flagged 25 foreign key columns with no
-- covering index — mostly audit/actor columns (created_by, reviewed_by,
-- actor_id, checked_by, etc.) and a few join keys (production_job_id,
-- quotation_id, invoice_id...). At this app's current size it's not
-- measurable, but it's a cheap, zero-risk fix that avoids sequential
-- scans once the admin/production dashboards start filtering and joining
-- on these at real volume.

create index idx_audit_log_actor_id on audit_log (actor_id);
create index idx_customers_created_by on customers (created_by);
create index idx_dispatches_created_by on dispatches (created_by);
create index idx_enquiries_created_by on enquiries (created_by);
create index idx_enquiry_files_uploaded_by on enquiry_files (uploaded_by);
create index idx_enquiry_revisions_changed_by on enquiry_revisions (changed_by);
create index idx_enquiry_revisions_enquiry_id on enquiry_revisions (enquiry_id);
create index idx_invoices_bank_account_id on invoices (bank_account_id);
create index idx_invoices_created_by on invoices (created_by);
create index idx_invoices_quotation_id on invoices (quotation_id);
create index idx_orders_authorised_by on orders (authorised_by);
create index idx_orders_invoice_id on orders (invoice_id);
create index idx_orders_payment_id on orders (payment_id);
create index idx_payments_reviewed_by on payments (reviewed_by);
create index idx_payments_submitted_by on payments (submitted_by);
create index idx_production_notes_created_by on production_notes (created_by);
create index idx_production_notes_production_job_id on production_notes (production_job_id);
create index idx_production_photos_created_by on production_photos (created_by);
create index idx_production_photos_production_job_id on production_photos (production_job_id);
create index idx_qc_checklists_checked_by on qc_checklists (checked_by);
create index idx_quotations_created_by on quotations (created_by);
create index idx_secure_links_created_by on secure_links (created_by);
create index idx_secure_links_customer_id on secure_links (customer_id);
create index idx_secure_links_enquiry_id on secure_links (enquiry_id);
create index idx_status_events_actor_id on status_events (actor_id);
create index idx_whatsapp_notes_created_by on whatsapp_notes (created_by);
