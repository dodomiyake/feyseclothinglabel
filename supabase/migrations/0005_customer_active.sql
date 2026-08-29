-- Lets admins deactivate a customer account: hides them from active flows
-- and (for registered accounts) blocks sign-in via the Auth admin API.
alter table customers add column if not exists is_active boolean not null default true;
