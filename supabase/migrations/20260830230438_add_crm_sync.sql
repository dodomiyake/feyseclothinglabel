-- Durable HubSpot CRM synchronisation.
-- Customer/enquiry writes remain authoritative in Supabase; this outbox keeps
-- external API failures from blocking or losing a customer submission.

alter table customers add column hubspot_contact_id text;
alter table enquiries add column hubspot_deal_id text;

create unique index idx_customers_hubspot_contact_id
  on customers (hubspot_contact_id)
  where hubspot_contact_id is not null;

create unique index idx_enquiries_hubspot_deal_id
  on enquiries (hubspot_deal_id)
  where hubspot_deal_id is not null;

create table crm_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('enquiry_upsert', 'enquiry_stage_update')),
  customer_id uuid not null references customers (id) on delete cascade,
  enquiry_id uuid not null references enquiries (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  last_error text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_crm_sync_jobs_ready
  on crm_sync_jobs (status, available_at, created_at)
  where status in ('pending', 'failed');

create index idx_crm_sync_jobs_customer_id
  on crm_sync_jobs (customer_id);

create index idx_crm_sync_jobs_enquiry_id
  on crm_sync_jobs (enquiry_id);

create trigger trg_crm_sync_jobs_updated_at before update on crm_sync_jobs
  for each row execute function set_updated_at();

alter table crm_sync_jobs enable row level security;

-- CRM jobs contain operational error details and are processed exclusively by
-- the server-side service-role client. They are not part of the public Data API.
revoke all on table crm_sync_jobs from anon, authenticated;
