import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";

const NAV_LINKS = [
  { href: "/products", label: "Labels & pricing" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#track", label: "Track an order" },
];

export async function SiteHeader() {
  const profile = await getCurrentProfile();
  const homeHref = profile?.role === "admin" ? "/admin/dashboard" : profile?.role === "production" ? "/production" : profile ? "/dashboard" : "/sign-in";

  return (
    <header className="sticky top-0 z-40 border-b border-ink-900/8 bg-cream-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-base font-semibold tracking-[0.15em] text-ink-950 uppercase">Feyse</span>
          <span className="text-xs tracking-[0.2em] text-gold-700 uppercase">Clothing Labels</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-ink-700 hover:text-ink-950">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button href={homeHref} variant="ghost" size="sm">
            {profile ? "My account" : "Sign in"}
          </Button>
          <Button href="/enquiry" variant="gold" size="sm">
            Start an enquiry
          </Button>
        </div>

        <MobileNav links={NAV_LINKS} signedIn={!!profile} homeHref={homeHref} />
      </div>
    </header>
  );
}
