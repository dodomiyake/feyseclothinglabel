import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SettingsTabs } from "@/components/domain/settings-tabs";
import { StaffForm } from "@/components/domain/staff-form";
import { toggleStaffActiveAction } from "@/lib/actions/staff";

export const metadata: Metadata = { title: "Team — Feyse Clothing Labels" };

export default async function AdminTeamPage() {
  const supabase = await createClient();
  const { data: staff } = await supabase.from("profiles").select("*").in("role", ["admin", "production"]).order("full_name");

  // profiles has no "active" flag for staff — ban status on the auth user
  // is the source of truth, so cross-reference it here for the list.
  const adminDb = createAdminClient();
  const bannedIds = new Set<string>();
  if (staff?.length) {
    const { data } = await adminDb.auth.admin.listUsers({ perPage: 200 });
    for (const u of data.users) {
      if (u.banned_until && new Date(u.banned_until) > new Date()) bannedIds.add(u.id);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">Settings</p>
        <h1 className="mt-1 font-serif text-3xl text-ink-950">Team accounts</h1>
      </div>

      <SettingsTabs active="team" />

      <Card>
        <CardHeader><CardTitle>Admins &amp; production staff</CardTitle></CardHeader>
        <CardBody className="space-y-2">
          {staff?.length ? (
            staff.map((s) => {
              const banned = bannedIds.has(s.id);
              return (
                <div key={s.id} className={`flex items-center justify-between rounded-xl border border-ink-900/8 p-3 text-sm ${banned ? "opacity-50" : ""}`}>
                  <div>
                    <p className="font-medium text-ink-900">{s.full_name}</p>
                    <p className="text-neutral-500">{s.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-cream-200 px-2.5 py-0.5 text-xs font-medium text-ink-700 capitalize">{s.role}</span>
                    <form action={toggleStaffActiveAction}>
                      <input type="hidden" name="user_id" value={s.id} />
                      <input type="hidden" name="banned" value={String(banned)} />
                      <Button type="submit" size="sm" variant="ghost">{banned ? "Reactivate" : "Deactivate"}</Button>
                    </form>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-neutral-500">No team accounts yet.</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Add a team member</CardTitle></CardHeader>
        <CardBody><StaffForm /></CardBody>
      </Card>
    </div>
  );
}
