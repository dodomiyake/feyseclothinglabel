"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationReadAction(formData: FormData) {
  const id = String(formData.get("notification_id") || "");
  const redirectPath = String(formData.get("redirect") || "");
  if (!id) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
  if (redirectPath) revalidatePath(redirectPath);
}

export async function markAllNotificationsReadAction(formData: FormData) {
  const redirectPath = String(formData.get("redirect") || "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
  if (redirectPath) revalidatePath(redirectPath);
}
