-- Multiple local customer rows can represent the same person (for example,
-- separate guest enquiries). HubSpot deduplicates them by email/WhatsApp, so
-- the external contact ID is intentionally non-unique on the local side.
drop index if exists idx_customers_hubspot_contact_id;

create index idx_customers_hubspot_contact_id
  on customers (hubspot_contact_id)
  where hubspot_contact_id is not null;
