import { Factory } from "lucide-react";
import { headers } from "next/headers";
import { requireProfile } from "@/lib/auth";
import { DashboardShell, type NavLink } from "@/components/layout/dashboard-shell";

const NAV_LINKS: NavLink[] = [{ href: "/production", label: "My jobs", icon: Factory }];

export default async function ProductionLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile("production", "admin");
  const pathname = (await headers()).get("x-pathname") ?? "/production";

  return (
    <DashboardShell navLinks={NAV_LINKS} activeHref={pathname} roleLabel="Production workspace" userName={profile.full_name}>
      {children}
    </DashboardShell>
  );
}
