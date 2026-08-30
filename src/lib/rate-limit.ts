import "server-only";
import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

// Vercel sets x-forwarded-for on every request; the first entry is the
// original client. Falls back to x-real-ip, then a constant so a missing
// header degrades to "everyone shares one bucket" rather than throwing.
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

// Fixed-window rate limiter backed by the rate_limit_hits table. Returns
// false (and does not record the attempt) once `limit` hits have landed in
// `bucket` within the trailing `windowMs`.
export async function checkRateLimit(
  admin: SupabaseClient,
  bucket: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs).toISOString();

  // Opportunistic cleanup — cheap at this app's traffic volume, keeps the
  // table from growing unbounded without needing a separate cron job.
  await admin.from("rate_limit_hits").delete().lt("created_at", since);

  const { count } = await admin
    .from("rate_limit_hits")
    .select("id", { count: "exact", head: true })
    .eq("bucket", bucket)
    .gte("created_at", since);

  if ((count ?? 0) >= limit) return false;

  await admin.from("rate_limit_hits").insert({ bucket });
  return true;
}
