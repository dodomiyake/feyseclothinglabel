import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client that BYPASSES Row Level Security entirely.
 *
 * Only ever import this from trusted server code (server actions, route
 * handlers). Never expose the service-role key to the browser. Use this for:
 *   - verifying secure portal-link tokens for unauthenticated customers
 *   - writing notifications / audit log entries on another user's behalf
 *   - admin actions that must read/write across ownership boundaries
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
