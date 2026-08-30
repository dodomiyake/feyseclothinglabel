import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = { title: "Privacy policy — Feyse Clothing Labels" };

const LAST_UPDATED = "29 August 2026";

export default function PrivacyPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-cream-200/40">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Privacy policy" }]} className="mb-6" />
          <p className="text-xs tracking-[0.3em] text-gold-700 uppercase">Legal</p>
          <h1 className="mt-2 font-serif text-4xl text-ink-950">Privacy policy</h1>
          <p className="mt-2 text-sm text-neutral-600">Last updated {LAST_UPDATED}</p>

          <div className="mt-8 space-y-8 text-sm leading-relaxed text-ink-800">
            <section>
              <h2 className="font-serif text-xl text-ink-950">1. Who we are</h2>
              <p className="mt-2">
                Feyse Clothing Labels (&ldquo;we&rdquo;, &ldquo;us&rdquo;) produces custom woven, printed and
                leather labels for fashion designers, tailors and clothing brands, based at Ogudu Industrial
                Layout, Lagos, Nigeria. This policy explains what personal information we collect through this
                website and our WhatsApp business line, why we collect it, and the choices you have.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-950">2. Information we collect</h2>
              <p className="mt-2">When you submit an enquiry, create an account, or place an order, we collect:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Contact details: your name, business name, email address, WhatsApp and delivery phone numbers.</li>
                <li>Order details: label specification, quantity, delivery address, and any artwork, logo or reference files you upload.</li>
                <li>Payment information: proof-of-payment images or PDFs and the bank transfer details you provide for verification. We do not collect or store your card or bank account credentials — payment is by direct bank transfer, verified manually against our own bank records.</li>
                <li>Account information: your password (stored only as a securely hashed value we cannot read) and login session data.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-950">3. How we use your information</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>To respond to enquiries, prepare quotations, and produce and deliver your order.</li>
                <li>To verify payments against our bank records and keep you updated on order status by email and WhatsApp.</li>
                <li>To maintain your account so you can track enquiries, quotations, invoices and orders.</li>
                <li>To meet our own accounting and legal record-keeping obligations.</li>
              </ul>
              <p className="mt-2">We do not sell your personal information, and we do not use it for third-party advertising.</p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-950">4. Who we share it with</h2>
              <p className="mt-2">
                We share the minimum information necessary with the service providers that run this site on our
                behalf: Supabase (database and file storage), Vercel (hosting), and Resend (transactional email
                delivery). These providers process data only to deliver their service to us and are not permitted
                to use it for their own purposes. We do not share your information with any other third party
                except where required by law.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-950">5. Cookies</h2>
              <p className="mt-2">
                We use only the essential cookies needed to keep you signed in securely. We do not use
                third-party advertising or analytics cookies on this site.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-950">6. Data retention</h2>
              <p className="mt-2">
                We keep enquiry, order and payment records for as long as your account is active and afterward
                for as long as needed to meet our accounting and legal obligations. You can ask us to delete your
                account and associated personal data at any time, subject to records we&apos;re required to keep.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-950">7. Your rights</h2>
              <p className="mt-2">
                Under the Nigeria Data Protection Act, you can ask us to access, correct, or delete the personal
                information we hold about you, or to tell you more about how it&apos;s used. To make a request,
                email us at{" "}
                <a href="mailto:hello@feyseclothinglabels.com" className="font-medium text-terracotta-600 hover:text-terracotta-700">
                  hello@feyseclothinglabels.com
                </a>.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-950">8. Changes to this policy</h2>
              <p className="mt-2">
                We may update this policy from time to time. We&apos;ll update the &ldquo;Last updated&rdquo;
                date above when we do.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-950">9. Contact us</h2>
              <p className="mt-2">
                Questions about this policy or your personal data can be sent to{" "}
                <a href="mailto:hello@feyseclothinglabels.com" className="font-medium text-terracotta-600 hover:text-terracotta-700">
                  hello@feyseclothinglabels.com
                </a>{" "}
                or via WhatsApp using the button in our site footer.
              </p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
