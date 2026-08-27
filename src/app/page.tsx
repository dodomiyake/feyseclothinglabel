import Link from "next/link";
import { ArrowRight, Factory, MessageCircle, ShieldCheck, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/domain/whatsapp-button";
import { LABEL_TYPE_META } from "@/lib/workflow";
import { formatCurrency } from "@/lib/currency";
import { businessWhatsAppLink, generalEnquiryWhatsAppMessage } from "@/lib/whatsapp";
import type { BusinessSettings, Product } from "@/lib/types";

const FALLBACK_BUSINESS: BusinessSettings = {
  id: true,
  business_name: "Feyse Clothing Labels",
  tagline: "Woven, printed and leather labels for fashion brands — made in Lagos.",
  logo_path: null,
  registered_address: "No. 14 Simbiat Abiola Way, Ikeja, Lagos, Nigeria",
  production_address: "Plot 22, Ogudu Industrial Layout, Ogudu, Lagos, Nigeria",
  support_whatsapp_number: "2348012345678",
  support_email: "hello@feyseclothinglabels.com",
  default_currency: "NGN",
  default_quotation_validity_days: 7,
  default_invoice_due_days: 3,
  invoice_terms: "",
  quotation_terms: "",
  updated_at: new Date().toISOString(),
};

const HOW_IT_WORKS = [
  {
    icon: MessageCircle,
    title: "Tell us what you need",
    body: "Message us on WhatsApp or submit an enquiry online with your label type, dimensions, quantity and artwork.",
  },
  {
    icon: ShieldCheck,
    title: "Approve your quotation",
    body: "We confirm specifications and send a quotation. Nothing goes into production until you've approved it.",
  },
  {
    icon: Factory,
    title: "Pay & we produce",
    body: "Pay by Nigerian bank transfer and upload your proof. Once we verify it, our Lagos team starts production and quality checks.",
  },
  {
    icon: Truck,
    title: "Track delivery",
    body: "Follow production and dispatch from your portal, right up to the rider dropping off your labels.",
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const [{ data: business }, { data: products }] = await Promise.all([
    supabase.from("business_settings").select("*").maybeSingle(),
    supabase.from("products").select("*").eq("active", true).order("sort_order").limit(4),
  ]);

  const biz = (business as BusinessSettings | null) ?? FALLBACK_BUSINESS;
  const featured = (products as Product[] | null) ?? [];
  const whatsappLink = businessWhatsAppLink(biz.support_whatsapp_number, generalEnquiryWhatsAppMessage());

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-ink-900/8 bg-ink-950 text-cream-50">
          <div className="label-texture absolute inset-0 opacity-[0.08]" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs tracking-[0.3em] text-gold-400 uppercase">Made in Lagos, worn everywhere</p>
              <h1 className="mt-4 font-serif text-4xl italic leading-tight text-cream-50 sm:text-5xl">
                Custom clothing labels, without leaving WhatsApp.
              </h1>
              <p className="mt-5 max-w-lg text-cream-300">
                {biz.tagline} Send your logo, agree specifications and pay by bank transfer — we handle
                quotations, production and dispatch, and keep you updated every step of the way.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/enquiry" variant="gold" size="lg">
                  Start an enquiry <ArrowRight className="h-4 w-4" />
                </Button>
                <WhatsAppButton href={whatsappLink} variant="outline" className="border-cream-50/30 text-cream-50 hover:bg-cream-50/10" />
              </div>
              <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-cream-50/10 pt-6 text-sm">
                <div>
                  <dt className="text-cream-400">Label types</dt>
                  <dd className="font-serif text-2xl text-gold-400">8+</dd>
                </div>
                <div>
                  <dt className="text-cream-400">Produced</dt>
                  <dd className="font-serif text-2xl text-gold-400">Lagos, NG</dd>
                </div>
                <div>
                  <dt className="text-cream-400">Dispatch</dt>
                  <dd className="font-serif text-2xl text-gold-400">Nationwide</dd>
                </div>
              </dl>
            </div>
            <div className="relative mx-auto w-full max-w-sm rounded-3xl border border-cream-50/15 bg-cream-50/5 p-6 backdrop-blur">
              <p className="text-xs tracking-[0.2em] text-gold-400 uppercase">Sample specification</p>
              <div className="mt-4 space-y-3 rounded-2xl bg-cream-50 p-5 text-ink-900 shadow-xl">
                <p className="font-serif text-lg italic">Woven Brand Label</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-ink-700">
                  <span>Size</span><span className="text-right">6 × 2.5 cm</span>
                  <span>Fold</span><span className="text-right">Centre fold</span>
                  <span>Quantity</span><span className="text-right">500 pcs</span>
                  <span>Colours</span><span className="text-right">Brown &amp; gold</span>
                </div>
                <div className="rounded-lg bg-cream-200 px-3 py-2 text-sm font-medium text-ink-900">
                  Unit price {formatCurrency(95)} · Total {formatCurrency(51000)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="max-w-xl">
            <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">How it works</p>
            <h2 className="mt-2 font-serif text-3xl text-ink-950">From WhatsApp message to delivered labels</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} className="rounded-2xl border border-ink-900/8 bg-cream-50 p-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-400/25 font-serif text-sm text-gold-700">
                    {i + 1}
                  </span>
                  <step.icon className="h-4 w-4 text-terracotta-600" />
                </div>
                <p className="mt-4 font-serif text-lg text-ink-950">{step.title}</p>
                <p className="mt-1.5 text-sm text-neutral-600">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Label types */}
        <section className="border-y border-ink-900/8 bg-cream-200/60">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">What we make</p>
                <h2 className="mt-2 font-serif text-3xl text-ink-950">Labels &amp; tags for every garment</h2>
              </div>
              <Link href="/products" className="text-sm font-medium text-terracotta-600 hover:text-terracotta-700">
                See all label types &amp; pricing →
              </Link>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {(featured.length ? featured : SAMPLE_PRODUCTS).map((p) => (
                <div key={p.id} className="rounded-2xl border border-ink-900/8 bg-cream-50 p-5">
                  <p className="text-xs tracking-[0.15em] text-gold-700 uppercase">{LABEL_TYPE_META[p.label_type].label}</p>
                  <p className="mt-1 font-serif text-lg text-ink-950">{p.name}</p>
                  <p className="mt-1.5 text-sm text-neutral-600">{p.description}</p>
                  <p className="mt-4 text-sm font-medium text-ink-900">
                    From {formatCurrency(p.base_unit_price, p.currency)} / label
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Track an order */}
        <section id="track" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-8 rounded-3xl bg-ink-950 p-8 text-cream-50 sm:p-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs tracking-[0.3em] text-gold-400 uppercase">Already a customer?</p>
              <h2 className="mt-2 font-serif text-3xl italic">Track your quotation, invoice or delivery</h2>
              <p className="mt-3 max-w-md text-cream-300">
                Sign in to see enquiry status, download your invoice, upload proof of payment or follow your
                order from production to your doorstep.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button href="/sign-in" variant="gold" size="lg">Sign in to your account</Button>
              <Button href="/enquiry" variant="outline" size="lg" className="border-cream-50/30 text-cream-50 hover:bg-cream-50/10">
                New here? Start an enquiry
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter supportWhatsApp={biz.support_whatsapp_number} />
    </>
  );
}

const SAMPLE_PRODUCTS: Product[] = [
  { id: "1", label_type: "woven_label", name: "Woven Brand Label", description: "Damask-woven label, soft or satin finish.", base_unit_price: 85, currency: "NGN", min_quantity: 200, image_path: null, active: true, sort_order: 1, created_at: "", updated_at: "" },
  { id: "2", label_type: "printed_fabric_label", name: "Printed Satin Label", description: "Full-colour print for detailed logos.", base_unit_price: 55, currency: "NGN", min_quantity: 200, image_path: null, active: true, sort_order: 2, created_at: "", updated_at: "" },
  { id: "3", label_type: "leather_patch", name: "Genuine Leather Patch", description: "Debossed leather for denim and bags.", base_unit_price: 220, currency: "NGN", min_quantity: 100, image_path: null, active: true, sort_order: 3, created_at: "", updated_at: "" },
  { id: "4", label_type: "hang_tag", name: "Kraft Card Hang Tag", description: "Recycled kraft swing tag with string.", base_unit_price: 65, currency: "NGN", min_quantity: 200, image_path: null, active: true, sort_order: 4, created_at: "", updated_at: "" },
];
