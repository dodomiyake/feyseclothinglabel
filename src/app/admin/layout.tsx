import { LayoutDashboard, Inbox, Users, Factory, Truck, Settings, Wallet } from "lucide-react";
import { headers } from "next/headers";
import { requireProfile } from "@/lib/auth";
import { DashboardShell, type NavLink } from "@/components/layout/dashboard-shell";

const NAV_LINKS: NavLink[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/inbox", label: "Enquiries", icon: Inbox },
  { href: "/admin/payments", label: "Payments", icon: Wallet },
  { href: "/admin/production", label: "Production", icon: Factory },
  { href: "/admin/dispatch", label: "Dispatch", icon: Truck },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/settings/business", label: "Settings", icon: Settings },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile("admin");
  const pathname = (await headers()).get("x-pathname") ?? "/admin/dashboard";

  return (
    <DashboardShell navLinks={NAV_LINKS} activeHref={pathname} roleLabel="Business administrator" userName={profile.full_name}>
      {children}
    </DashboardShell>
  );
}
