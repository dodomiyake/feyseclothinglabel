import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { QuotationBuilderForm } from "@/components/domain/quotation-builder-form";
import { describeSpec } from "@/lib/spec";

export const metadata: Metadata = { title: "Quotation builder — Feyse Clothing Labels" };

export default async function QuotationBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: enquiry } = await supabase.from("enquiries").select("*, customer:customers(*)").eq("id", id).maybeSingle();
  if (!enquiry) notFound();

  const [{ data: product }, { data: business }] = await Promise.all([
    enquiry.label_type
      ? supabase.from("products").select("base_unit_price").eq("label_type", enquiry.label_type).eq("active", true).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("business_settings").select("*").single(),
  ]);

  // eslint-disable-next-line react-hooks/purity -- server component, evaluated once per request
  const validUntil = new Date(Date.now() + (business?.default_quotation_validity_days ?? 7) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return (
    <div className="max-w-2xl space-y-6">
      <Breadcrumb
        items={[
          { label: "Inbox", href: "/admin/inbox" },
          { label: enquiry.enquiry_number, href: `/admin/enquiries/${id}` },
          { label: "Quotation" },
        ]}
      />

      <div>
        <p className="text-xs tracking-[0.3em] text-gold-700 uppercase">Quotation builder</p>
        <h1 className="mt-1 font-serif text-3xl text-ink-950">{enquiry.enquiry_number}</h1>
        <p className="mt-1 text-sm text-neutral-600">{enquiry.customer?.business_name || enquiry.customer?.full_name} — {describeSpec(enquiry)}</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
        <CardBody>
          <QuotationBuilderForm
            enquiryId={id}
            suggestedUnitPrice={product?.base_unit_price ?? 50}
            suggestedQuantity={enquiry.quantity ?? 100}
            defaultValidUntil={validUntil}
            defaultTerms={business?.quotation_terms ?? ""}
          />
        </CardBody>
      </Card>
    </div>
  );
}
