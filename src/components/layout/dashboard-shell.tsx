import Link from "next/link";
import { Bell } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { WhatsAppButton } from "@/components/domain/whatsapp-button";
import { businessWhatsAppLink, generalEnquiryWhatsAppMessage } from "@/lib/whatsapp";

export interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function DashboardShell({
  navLinks,
  activeHref,
  roleLabel,
  userName,
  unreadCount = 0,
  children,
  supportWhatsApp = "2348012345678",
}: {
  navLinks: NavLink[];
  activeHref: string;
  roleLabel: string;
  userName: string;
  unreadCount?: number;
  children: React.ReactNode;
  supportWhatsApp?: string;
}) {
  return (
    <div className="flex min-h-screen bg-cream-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-900/8 bg-cream-50 lg:flex">
        <div className="px-5 py-5">
          <Link href="/" className="flex items-baseline gap-1.5">
            <span className="font-serif text-lg italic text-ink-950">Feyse</span>
            <span className="font-serif text-lg italic text-ink-950/55">Labels</span>
          </Link>
          <p className="mt-0.5 text-xs text-neutral-500">{roleLabel}</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {navLinks.map((link) => {
            const active = activeHref === link.href || (link.href !== "/" && activeHref.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active ? "bg-ink-900 text-cream-50" : "text-ink-700 hover:bg-ink-900/5"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-3 border-t border-ink-900/8 p-4">
          <WhatsAppButton href={businessWhatsAppLink(supportWhatsApp, generalEnquiryWhatsAppMessage())} className="w-full" />
          <form action={signOutAction}>
            <button className="w-full rounded-full border border-ink-900/15 px-4 py-2 text-sm text-ink-700 hover:bg-ink-900/5">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-ink-900/8 bg-cream-50 px-4 py-3 lg:px-8">
          <div className="lg:hidden">
            <Link href="/" className="font-serif text-lg italic text-ink-950">Feyse</Link>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm text-neutral-500">Welcome back,</p>
            <p className="font-serif text-lg text-ink-950">{userName}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-full p-2 text-ink-700 hover:bg-ink-900/5" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-terracotta-600 text-[10px] text-cream-50">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-ink-900/8 bg-cream-50 px-3 py-2 lg:hidden">
          {navLinks.map((link) => {
            const active = activeHref === link.href || (link.href !== "/" && activeHref.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                  active ? "bg-ink-900 text-cream-50" : "bg-ink-900/5 text-ink-700"
                }`}
              >
                <link.icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
