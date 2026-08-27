import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { LABEL_TYPE_META } from "@/lib/workflow";
import { formatCurrency } from "@/lib/currency";
import type { Product } from "@/lib/types";

export const metadata: Metadata = { title: "Labels & pricing — Feyse Clothing Labels" };

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("products").select("*").eq("active", true).order("sort_order");
  const products = (data as Product[] | null) ?? [];

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-ink-900/8 bg-cream-200/60">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">Labels &amp; pricing</p>
            <h1 className="mt-2 max-w-2xl font-serif text-4xl text-ink-950">
              Every label type we produce, with a starting price per piece
            </h1>
            <p className="mt-3 max-w-xl text-neutral-600">
              Final pricing depends on size, colours, material and quantity — every enquiry gets a tailored
              quotation. Prices shown are indicative starting points in Nigerian naira (NGN).
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/enquiry" variant="gold">Start an enquiry</Button>
              <Button href="/enquiry?help=1" variant="outline">
                <HelpCircle className="h-4 w-4" /> I need help choosing
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="flex flex-col rounded-2xl border border-ink-900/8 bg-cream-50 p-6">
                <p className="text-xs tracking-[0.15em] text-gold-700 uppercase">{LABEL_TYPE_META[p.label_type].label}</p>
                <p className="mt-1.5 font-serif text-xl text-ink-950">{p.name}</p>
                <p className="mt-2 flex-1 text-sm text-neutral-600">{p.description}</p>
                <div className="mt-5 flex items-baseline justify-between border-t border-ink-900/8 pt-4">
                  <div>
                    <p className="text-lg font-medium text-ink-900">{formatCurrency(p.base_unit_price, p.currency)}</p>
                    <p className="text-xs text-neutral-500">per label · min. {p.min_quantity} pcs</p>
                  </div>
                  <Link
                    href={`/enquiry?label_type=${p.label_type}`}
                    className="text-sm font-medium text-terracotta-600 hover:text-terracotta-700"
                  >
                    Request this →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {!products.length && (
            <p className="text-sm text-neutral-500">
              Pricing is being updated — message us on WhatsApp or start an enquiry and we&apos;ll quote you directly.
            </p>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
