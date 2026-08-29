import { LayoutDashboard, Inbox, Users, Factory, Truck, Settings, Wallet } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell, type NavLink } from "@/components/layout/dashboard-shell";

const ICON_CLASS = "h-4 w-4";
const NAV_LINKS: NavLink[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className={ICON_CLASS} /> },
  { href: "/admin/inbox", label: "Enquiries", icon: <Inbox className={ICON_CLASS} /> },
  { href: "/admin/payments", label: "Payments", icon: <Wallet className={ICON_CLASS} /> },
  { href: "/admin/production", label: "Production", icon: <Factory className={ICON_CLASS} /> },
  { href: "/admin/dispatch", label: "Dispatch", icon: <Truck className={ICON_CLASS} /> },
  { href: "/admin/customers", label: "Customers", icon: <Users className={ICON_CLASS} /> },
  { href: "/admin/settings/business", label: "Settings", icon: <Settings className={ICON_CLASS} /> },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile("admin");
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .is("read_at", null);

  return (
    <DashboardShell
      navLinks={NAV_LINKS}
      roleLabel="Business administrator"
      userName={profile.full_name}
      unreadCount={count ?? 0}
      notificationsHref="/admin/notifications"
    >
      {children}
    </DashboardShell>
  );
}
