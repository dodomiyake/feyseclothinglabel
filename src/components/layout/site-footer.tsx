import Link from "next/link";
import { WhatsAppButton } from "@/components/domain/whatsapp-button";
import { businessWhatsAppLink, generalEnquiryWhatsAppMessage } from "@/lib/whatsapp";

export function SiteFooter({ supportWhatsApp = "2348012345678" }: { supportWhatsApp?: string }) {
  return (
    <footer className="mt-auto border-t border-ink-900/8 bg-ink-950 text-cream-200">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <p className="flex flex-wrap items-baseline gap-2">
              <span className="text-base font-semibold tracking-[0.15em] text-cream-50 uppercase">Feyse</span>
              <span className="text-xs tracking-[0.2em] text-gold-400 uppercase">Clothing Labels</span>
            </p>
            <p className="mt-2 text-sm text-cream-300">
              Custom woven, printed and leather labels for fashion designers, tailors and clothing brands —
              produced in Lagos, dispatched nationwide.
            </p>
            <WhatsAppButton
              href={businessWhatsAppLink(supportWhatsApp, generalEnquiryWhatsAppMessage())}
              className="mt-4"
            />
          </div>
          <div>
            <p className="text-xs tracking-[0.2em] text-gold-400 uppercase">Explore</p>
            <ul className="mt-3 space-y-2 text-sm text-cream-300">
              <li><Link href="/products" className="hover:text-cream-50">Labels &amp; pricing</Link></li>
              <li><Link href="/enquiry" className="hover:text-cream-50">Start an enquiry</Link></li>
              <li><Link href="/sign-in" className="hover:text-cream-50">Customer sign in</Link></li>
              <li><Link href="/privacy" className="hover:text-cream-50">Privacy policy</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs tracking-[0.2em] text-gold-400 uppercase">Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-cream-300">
              <li>hello@feyseclothinglabels.com</li>
              <li>+{supportWhatsApp}</li>
              <li>Ogudu Industrial Layout, Lagos, Nigeria</li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-cream-50/10 pt-6 text-xs text-cream-400">
          © {new Date().getFullYear()} Feyse Clothing Labels. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
