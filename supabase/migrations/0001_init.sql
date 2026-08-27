-- Feyse Clothing Labels — core schema
-- Roles: customer, admin, production. Auth via Supabase Auth (auth.users).

create extension if not exists "pgcrypto";

-- =========================================================================
-- ENUMS
-- =========================================================================

create type user_role as enum ('customer', 'admin', 'production');

create type workflow_status as enum (
  'draft',
  'submitted',
  'under_review',
  'changes_requested',
  'quotation_sent',
  'quotation_accepted',
  'quotation_declined',
  'invoice_issued',
  'awaiting_payment',
  'payment_evidence_submitted',
  'payment_under_review',
  'payment_confirmed',
  'production_authorised',
  'in_production',
  'quality_check',
  'ready_for_dispatch',
  'out_for_delivery',
  'delivered',
  'completed',
  'payment_rejected',
  'on_hold',
  'cancelled',
  'refund_pending',
  'refunded',
  'delivery_unsuccessful'
);

create type label_type as enum (
  'woven_label',
  'printed_fabric_label',
  'satin_label',
  'leather_patch',
  'faux_leather_patch',
  'care_label',
  'size_label',
  'hang_tag',
  'main_brand_label',
  'other'
);

create type measurement_unit as enum ('cm', 'inch', 'mm');

create type fold_type as enum (
  'straight_cut',
  'center_fold',
  'end_fold',
  'loop_fold',
  'manhattan_fold',
  'no_fold'
);

create type quotation_status as enum ('draft', 'sent', 'accepted', 'declined', 'expired', 'superseded');

create type invoice_status as enum (
  'issued',
  'awaiting_payment',
  'payment_evidence_submitted',
  'payment_under_review',
  'payment_confirmed',
  'payment_rejected',
  'cancelled'
);

create type payment_status as enum ('submitted', 'under_review', 'confirmed', 'rejected');

create type production_stage as enum (
  'not_started',
  'in_production',
  'quality_check',
  'ready_for_dispatch',
  'completed'
);

create type qc_result as enum ('pending', 'pass', 'fail');

create type dispatch_status as enum (
  'pending',
  'collected',
  'out_for_delivery',
  'delivered',
  'delivery_unsuccessful'
);

-- =========================================================================
-- HELPER FUNCTIONS
-- =========================================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profile of the currently authenticated user (security definer avoids RLS recursion)
create or replace function current_profile_role()
returns user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false);
$$;

create or replace function is_production_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select role = 'production' from profiles where id = auth.uid()), false);
$$;

create table document_sequences (
  prefix text primary key,
  year int not null,
  next_value int not null default 1
);

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
  insert into document_sequences (prefix, year, next_value)
  values (p_prefix, v_year, 2)
  on conflict (prefix) do update
    set next_value = case when document_sequences.year = v_year then document_sequences.next_value + 1 else 2 end,
        year = v_year
  returning (case when next_value = 2 and year = v_year then 1 else next_value - 1 end) into v_value;

  return p_prefix || '-' || v_year || '-' || lpad(v_value::text, 4, '0');
end;
$$;

-- =========================================================================
-- PROFILES (extends auth.users)
-- =========================================================================

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'customer',
  full_name text not null,
  email text not null,
  whatsapp_number text,
  delivery_phone text,
  business_name text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a profile row when a new auth user signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, role, full_name, email, whatsapp_number)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'customer'),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'whatsapp_number'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =========================================================================
-- CUSTOMERS (canonical customer record; may exist before the customer signs up)
-- =========================================================================

create table customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references profiles (id) on delete set null,
  full_name text not null,
  business_name text,
  email text,
  whatsapp_number text not null,
  delivery_phone text,
  source text not null default 'website',
  notes text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_customers_updated_at before update on customers
  for each row execute function set_updated_at();

create index idx_customers_user_id on customers (user_id);
create index idx_customers_whatsapp on customers (whatsapp_number);

-- =========================================================================
-- BUSINESS SETTINGS, BANK ACCOUNTS, PRODUCTS
-- =========================================================================

create table business_settings (
  id boolean primary key default true constraint business_settings_singleton check (id),
  business_name text not null default 'Feyse Clothing Labels',
  tagline text not null default 'Custom woven, printed and leather labels for fashion brands',
  logo_path text,
  registered_address text not null default 'No. 14 Simbiat Abiola Way, Ikeja, Lagos, Nigeria',
  production_address text not null default 'Plot 22, Ogudu Industrial Layout, Ogudu, Lagos, Nigeria',
  support_whatsapp_number text not null default '2348012345678',
  support_email text not null default 'hello@feyseclothinglabels.com',
  default_currency text not null default 'NGN',
  default_quotation_validity_days int not null default 7,
  default_invoice_due_days int not null default 3,
  invoice_terms text not null default 'Payment is due within 3 days of invoice date. Production begins only after payment has been verified by our team. Please use your order number as the transfer narration.',
  quotation_terms text not null default 'This quotation is valid for 7 days from the issue date. Prices may change after the validity period. A quotation is not an invoice and does not reserve production capacity.',
  updated_at timestamptz not null default now()
);

insert into business_settings (id) values (true);

create trigger trg_business_settings_updated_at before update on business_settings
  for each row execute function set_updated_at();

create table bank_accounts (
  id uuid primary key default gen_random_uuid(),
  bank_name text not null,
  account_name text not null,
  account_number text not null,
  currency text not null default 'NGN',
  is_default boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  label_type label_type not null,
  name text not null,
  description text not null,
  base_unit_price numeric(12, 2) not null,
  currency text not null default 'NGN',
  min_quantity int not null default 100,
  image_path text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();

create table message_templates (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  title text not null,
  channel text not null default 'whatsapp',
  body_template text not null,
  updated_at timestamptz not null default now()
);

create trigger trg_message_templates_updated_at before update on message_templates
  for each row execute function set_updated_at();

-- =========================================================================
-- ENQUIRIES
-- =========================================================================

create table enquiries (
  id uuid primary key default gen_random_uuid(),
  enquiry_number text unique not null default next_document_number('ENQ'),
  customer_id uuid not null references customers (id) on delete cascade,
  status workflow_status not null default 'draft',

  label_type label_type,
  material text,
  width numeric(10, 2),
  height numeric(10, 2),
  measurement_unit measurement_unit not null default 'cm',
  quantity int,
  background_colour text,
  text_colour text,
  fold_type fold_type,
  needs_help_choosing boolean not null default false,
  additional_instructions text,

  delivery_address text,
  delivery_city text,
  delivery_state text,
  delivery_phone text,
  required_date date,

  created_by uuid references profiles (id),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_enquiries_updated_at before update on enquiries
  for each row execute function set_updated_at();

create index idx_enquiries_customer on enquiries (customer_id);
create index idx_enquiries_status on enquiries (status);

create table enquiry_files (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references enquiries (id) on delete cascade,
  file_path text not null,
  file_kind text not null default 'reference', -- logo | reference | final_artwork
  original_name text,
  uploaded_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index idx_enquiry_files_enquiry on enquiry_files (enquiry_id);

create table enquiry_revisions (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references enquiries (id) on delete cascade,
  spec_snapshot jsonb not null,
  note text,
  changed_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create table whatsapp_notes (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references enquiries (id) on delete cascade,
  direction text not null default 'inbound', -- inbound | outbound
  note text not null,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index idx_whatsapp_notes_enquiry on whatsapp_notes (enquiry_id);

create table status_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null, -- enquiry | order
  entity_id uuid not null,
  from_status workflow_status,
  to_status workflow_status not null,
  note text,
  actor_id uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index idx_status_events_entity on status_events (entity_type, entity_id);

-- =========================================================================
-- QUOTATIONS & INVOICES
-- =========================================================================

create table quotations (
  id uuid primary key default gen_random_uuid(),
  quotation_number text unique not null default next_document_number('QUO'),
  enquiry_id uuid not null references enquiries (id) on delete cascade,
  version int not null default 1,
  status quotation_status not null default 'draft',

  spec_snapshot jsonb not null,
  unit_price numeric(12, 2) not null,
  quantity int not null,
  subtotal numeric(12, 2) not null,
  delivery_fee numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null,
  currency text not null default 'NGN',

  valid_until date not null,
  terms text,
  customer_response_note text,

  created_by uuid references profiles (id),
  sent_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_quotations_updated_at before update on quotations
  for each row execute function set_updated_at();

create index idx_quotations_enquiry on quotations (enquiry_id);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null default next_document_number('INV'),
  enquiry_id uuid not null references enquiries (id) on delete cascade,
  quotation_id uuid not null references quotations (id),
  status invoice_status not null default 'issued',

  subtotal numeric(12, 2) not null,
  delivery_fee numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  total numeric(12, 2) not null,
  currency text not null default 'NGN',
  bank_account_id uuid references bank_accounts (id),

  issue_date date not null default current_date,
  due_date date not null,
  terms text,

  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_invoices_updated_at before update on invoices
  for each row execute function set_updated_at();

create index idx_invoices_enquiry on invoices (enquiry_id);

create table payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  amount_paid numeric(12, 2) not null,
  payment_date date not null,
  sender_account_name text not null,
  sender_bank text,
  evidence_file_path text not null,
  status payment_status not null default 'submitted',
  rejection_reason text,
  reviewed_by uuid references profiles (id),
  reviewed_at timestamptz,
  submitted_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index idx_payments_invoice on payments (invoice_id);

-- =========================================================================
-- ORDERS, PRODUCTION, QC, DISPATCH
-- =========================================================================

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default next_document_number('ORD'),
  enquiry_id uuid not null references enquiries (id),
  invoice_id uuid not null references invoices (id),
  payment_id uuid references payments (id),
  status workflow_status not null default 'production_authorised',
  production_deadline date,
  authorised_by uuid references profiles (id),
  authorised_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_orders_updated_at before update on orders
  for each row execute function set_updated_at();

create unique index idx_orders_enquiry on orders (enquiry_id);

create table production_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid unique not null references orders (id) on delete cascade,
  assigned_to uuid references profiles (id),
  stage production_stage not null default 'not_started',
  started_at timestamptz,
  completed_at timestamptz,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_production_jobs_updated_at before update on production_jobs
  for each row execute function set_updated_at();

create index idx_production_jobs_assigned on production_jobs (assigned_to);

create table production_notes (
  id uuid primary key default gen_random_uuid(),
  production_job_id uuid not null references production_jobs (id) on delete cascade,
  note text not null,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create table production_photos (
  id uuid primary key default gen_random_uuid(),
  production_job_id uuid not null references production_jobs (id) on delete cascade,
  file_path text not null,
  caption text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create table qc_checklists (
  id uuid primary key default gen_random_uuid(),
  production_job_id uuid unique not null references production_jobs (id) on delete cascade,
  correct_artwork boolean not null default false,
  correct_spelling boolean not null default false,
  correct_dimensions boolean not null default false,
  correct_colours boolean not null default false,
  correct_material boolean not null default false,
  correct_quantity boolean not null default false,
  acceptable_quality boolean not null default false,
  packaging_completed boolean not null default false,
  overall_result qc_result not null default 'pending',
  notes text,
  checked_by uuid references profiles (id),
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_qc_checklists_updated_at before update on qc_checklists
  for each row execute function set_updated_at();

create table dispatches (
  id uuid primary key default gen_random_uuid(),
  order_id uuid unique not null references orders (id) on delete cascade,
  rider_name text,
  rider_phone text,
  dispatch_company text,
  collection_at timestamptz,
  dispatch_fee numeric(12, 2) not null default 0,
  delivery_address text not null,
  tracking_reference text,
  status dispatch_status not null default 'pending',
  proof_of_delivery_path text,
  customer_confirmed_at timestamptz,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_dispatches_updated_at before update on dispatches
  for each row execute function set_updated_at();

-- =========================================================================
-- SECURE PORTAL LINKS (for customers arriving via WhatsApp)
-- =========================================================================

create table secure_links (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default encode(gen_random_bytes(24), 'base64url'),
  customer_id uuid not null references customers (id) on delete cascade,
  enquiry_id uuid references enquiries (id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '14 days'),
  used_at timestamptz,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index idx_secure_links_token on secure_links (token);

-- =========================================================================
-- NOTIFICATIONS & AUDIT LOG
-- =========================================================================

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications (user_id, read_at);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles (id),
  actor_role user_role,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_log_entity on audit_log (entity_type, entity_id);
