import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { PaymentEvidenceForm } from "@/components/domain/payment-evidence-form";

export const metadata: Metadata = { title: "Submit payment — Feyse Clothing Labels" };

export default async function SubmitPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireProfile("customer");
  const supabase = await createClient();

  const { data: invoice } = await supabase.from("invoices").select("*, enquiry:enquiries(enquiry_number)").eq("id", id).maybeSingle();
  if (!invoice) notFound();

  return (
    <div className="max-w-lg space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: invoice.invoice_number, href: `/invoices/${id}` },
          { label: "Submit payment" },
        ]}
      />

      <div>
        <p className="text-xs tracking-[0.3em] text-gold-700 uppercase">Payment evidence</p>
        <h1 className="mt-1 font-serif text-3xl text-ink-950">Submit proof of payment</h1>
        <p className="mt-1 text-sm text-neutral-600">Invoice {invoice.invoice_number} · Enquiry {invoice.enquiry.enquiry_number}</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Payment details</CardTitle></CardHeader>
        <CardBody>
          <PaymentEvidenceForm invoiceId={invoice.id} suggestedAmount={invoice.total} />
        </CardBody>
      </Card>
      <p className="text-xs text-neutral-600">
        Your order moves to production only after our team confirms this payment against our bank records. This
        usually takes a few hours during business days.
      </p>
    </div>
  );
}
