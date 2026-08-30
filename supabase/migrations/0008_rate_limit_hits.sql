-- Generic IP-based rate limiting store for public, unauthenticated actions
-- (enquiry submission, sign-up). Only ever touched via the service-role
-- client from within server actions — never exposed to anon/authenticated
-- clients — so RLS is enabled with no policies at all.
create table rate_limit_hits (
  id bigint generated always as identity primary key,
  bucket text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_hits_bucket_created_at_idx on rate_limit_hits (bucket, created_at);

alter table rate_limit_hits enable row level security;
