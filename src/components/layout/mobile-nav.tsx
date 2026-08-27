"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MobileNav({
  links,
  signedIn,
  homeHref,
}: {
  links: { href: string; label: string }[];
  signedIn: boolean;
  homeHref: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        className="rounded-full p-2 text-ink-900 hover:bg-ink-900/5"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-ink-900/8 bg-cream-50 px-4 pb-5 pt-2 shadow-lg">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-sm text-ink-800 hover:bg-ink-900/5"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            <Button href={homeHref} variant="outline" size="sm" onClick={() => setOpen(false)}>
              {signedIn ? "My account" : "Sign in"}
            </Button>
            <Button href="/enquiry" variant="gold" size="sm" onClick={() => setOpen(false)}>
              Start an enquiry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
