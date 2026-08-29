import { Factory } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, type NavLink } from "@/components/layout/dashboard-shell";

const NAV_LINKS: NavLink[] = [{ href: "/production", label: "My jobs", icon: <Factory className="h-4 w-4" /> }];

export default async function ProductionLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile("production", "admin");
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .is("read_at", null);

  return (
    <DashboardShell
      navLinks={NAV_LINKS}
      roleLabel="Production workspace"
      userName={profile.full_name}
      unreadCount={count ?? 0}
      notificationsHref="/production/notifications"
    >
      {children}
    </DashboardShell>
  );
}
