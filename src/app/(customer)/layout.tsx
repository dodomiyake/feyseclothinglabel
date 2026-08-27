import { LayoutDashboard, Package } from "lucide-react";
import { headers } from "next/headers";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, type NavLink } from "@/components/layout/dashboard-shell";

const NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "My orders", icon: Package },
];

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile("customer");
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .is("read_at", null);

  const pathname = (await headers()).get("x-pathname") ?? "/dashboard";

  return (
    <DashboardShell navLinks={NAV_LINKS} activeHref={pathname} roleLabel="Customer portal" userName={profile.full_name} unreadCount={count ?? 0}>
      {children}
    </DashboardShell>
  );
}
