import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NotificationsList } from "@/components/domain/notifications-list";

export const metadata: Metadata = { title: "Notifications — Feyse Clothing Labels" };

export default async function ProductionNotificationsPage() {
  const profile = await requireProfile("production", "admin");
  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-xs tracking-[0.3em] text-gold-700 uppercase">Notifications</p>
        <h1 className="mt-1 font-serif text-3xl text-ink-950">Notifications</h1>
      </div>
      <NotificationsList notifications={notifications ?? []} role="production" redirectPath="/production/notifications" />
    </div>
  );
}
