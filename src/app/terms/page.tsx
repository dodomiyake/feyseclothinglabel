import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = { title: "Terms of service — Feyse Clothing Labels" };

const LAST_UPDATED = "30 August 2026";

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-cream-200/40">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Terms of service" }]} className="mb-6" />
          <p className="text-xs tracking-[0.3em] text-gold-700 uppercase">Legal</p>
          <h1 className="mt-2 font-serif text-4xl text-ink-950">Terms of service</h1>
          <p className="mt-2 text-sm text-neutral-600">Last updated {LAST_UPDATED}</p>

          <div className="mt-8 space-y-8 text-sm leading-relaxed text-ink-800">
            <section>
              <h2 className="font-serif text-xl text-ink-950">1. About us</h2>
              <p className="mt-2">
                These terms govern your use of this website and any enquiry, quotation, order or account you place
                or hold with Feyse Clothing Labels (&ldquo;we&rdquo;, &ldquo;us&rdquo;), a custom label producer
                based at Ogudu Industrial Layout, Lagos, Nigeria. By submitting an enquiry, creating an account or
                accepting a quotation, you agree to these terms.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-950">2. Enquiries and quotations</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Submitting an enquiry does not create a binding order — it is a request for a quotation.</li>
                <li>Prices shown on the Labels &amp; pricing page are indicative starting points; your actual price depends on size, colours, material, finish and quantity, and is confirmed in the quotation we send you.</li>
                <li>A quotation is only binding once you accept it and it is confirmed by us; we may withdraw or revise an unaccepted quotation at any time.</li>
                <li>We may decline any enquiry or quotation at our discretion, including where we suspect misuse of the form or where required quantities fall below our stated minimums.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-950">3. Payment</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Payment is by direct bank transfer to the account details we provide. We do not accept card payments through this website and never ask for card or bank login credentials.</li>
                <li>Production begins only after we have verified your payment evidence against our own bank records — uploading a proof of payment does not itself confirm payment.</li>
                <li>Submitting fraudulent or altered proof-of-payment evidence is a breach of these terms and may result in your account being suspended and the order cancelled.</li>
                <li>All prices are quoted in Nigerian naira (NGN) unless stated otherwise, and exclude any bank transfer charges your bank may apply.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-950">4. Production and delivery</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Production timelines communicated to you are estimates, not guarantees, and can be affected by material availability, order volume, or the complexity of your design.</li>
                <li>You are responsible for reviewing and approving your label proof or specification before production starts — once production has begun, changes may not be possible and may incur additional cost.</li>
                <li>Delivery is arranged to the address you provide; risk in the goods passes to you once they are handed to the courier or collected.</li>
                <li>Please inspect your order on delivery and contact us promptly, and in any case within 7 days, about any defect, shortfall or mismatch with your confirmed specification.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-950">5. Cancellations and refunds</h2>
              <p className="mt-2">
                Because labels are produced to your custom specification, we&apos;re unable to accept cancellations
                or offer refunds once production has started. Before production begins, you may request a
                cancellation by contacting us on WhatsApp or by email, and any payment already made will be
                refunded to the account it was paid from, less any costs already reasonably incurred. Where labels
                are delivered defective or materially different from your confirmed specification through our
                error, we will remake or refund the affected items.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-950">6. Artwork, logos and intellectual property</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>You confirm that any logo, artwork or reference file you upload is either your own, or that you have the right to have it reproduced on labels for your business.</li>
                <li>You retain ownership of your artwork and brand assets. We use them solely to produce your order and will not reuse them for any other purpose without your consent.</li>
                <li>You are responsible for ensuring your design does not infringe a third party&apos;s trademark or copyright; we are not liable for claims arising from artwork you supplied.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-950">7. Your account</h2>
              <p className="mt-2">
                You&apos;re responsible for keeping your account password confidential and for all activity under
                your account. Tell us immediately if you believe your account has been accessed without
                authorisation. We may suspend or close an account that we reasonably believe is being used
                fraudulently or in breach of these terms.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-950">8. Limitation of liability</h2>
              <p className="mt-2">
                To the extent permitted by law, our liability for any claim relating to an order is limited to the
                amount you paid for that order. We are not liable for indirect or consequential losses, including
                loss of business or anticipated profit, arising from delays, production issues or delivery
                outside our reasonable control.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-950">9. Governing law</h2>
              <p className="mt-2">
                These terms are governed by the laws of the Federal Republic of Nigeria, and any dispute arising
                from them is subject to the exclusive jurisdiction of the Nigerian courts.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-950">10. Changes to these terms</h2>
              <p className="mt-2">
                We may update these terms from time to time. We&apos;ll update the &ldquo;Last updated&rdquo; date
                above when we do; continued use of the site or your account after a change means you accept the
                updated terms.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-ink-950">11. Contact us</h2>
              <p className="mt-2">
                Questions about these terms can be sent to{" "}
                <a href="mailto:hello@feyseclothinglabels.com" className="font-medium text-terracotta-600 hover:text-terracotta-700">
                  hello@feyseclothinglabels.com
                </a>{" "}
                or via WhatsApp using the button in our site footer. See also our{" "}
                <Link href="/privacy" className="font-medium text-terracotta-600 hover:text-terracotta-700">
                  Privacy policy
                </Link>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
