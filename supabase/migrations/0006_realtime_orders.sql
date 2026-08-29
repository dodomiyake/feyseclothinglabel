-- Enable Supabase Realtime (Postgres Changes) for the tables the customer
-- order-tracking page needs to live-update on: order status transitions and
-- dispatch/rider info. RLS still applies to realtime subscriptions, and the
-- existing orders_select / dispatches_select policies already grant the
-- owning customer read access, so no policy changes are needed here.
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table dispatches;
