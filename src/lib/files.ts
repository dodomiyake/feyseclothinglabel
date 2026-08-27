import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Signed URL scoped to the current user's session — respects storage RLS. */
export async function getSignedFileUrl(bucket: string, path: string | null | undefined, expiresIn = 3600) {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}
