import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { StatusBadge } from "@/components/domain/status-badge";
import { QuotationResponse } from "@/components/domain/quotation-response";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/currency";
import { describeSpec } from "@/lib/spec";

export const metadata: Metadata = { title: "Quotation — Feyse Clothing Labels" };

export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireProfile("customer");
  const supabase = await createClient();

  const { data: quotation } = await supabase.from("quotations").select("*, enquiry:enquiries(*)").eq("id", id).maybeSingle();
  if (!quotation) notFound();

  const { data: invoice } = await supabase.from("invoices").select("id").eq("quotation_id", id).maybeSingle();
  const spec = describeSpec(quotation.enquiry);
  const isExpired = new Date(quotation.valid_until) < new Date() && quotation.status === "sent";

  return (
    <div className="max-w-2xl space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: quotation.quotation_number }]} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.3em] text-gold-700 uppercase">Quotation</p>
          <h1 className="mt-1 font-serif text-3xl text-ink-950">{quotation.quotation_number}</h1>
          <p className="mt-1 text-sm text-neutral-600">For enquiry {quotation.enquiry.enquiry_number}</p>
        </div>
        <StatusBadge status={quotation.enquiry.status} className="text-sm" />
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Summary</CardTitle>
          <a href={`/api/pdf/quotation/${quotation.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-terracotta-600 hover:text-terracotta-700">
            <Download className="h-3.5 w-3.5" /> Download PDF
          </a>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-ink-800">{spec}</p>
          <div className="grid grid-cols-2 gap-y-2 border-t border-ink-900/8 pt-4 text-sm sm:grid-cols-4">
            <div><dt className="text-xs text-neutral-600">Quantity</dt><dd className="text-ink-900">{quotation.quantity}</dd></div>
            <div><dt className="text-xs text-neutral-600">Unit price</dt><dd className="text-ink-900">{formatCurrency(quotation.unit_price, quotation.currency)}</dd></div>
            <div><dt className="text-xs text-neutral-600">Issued</dt><dd className="text-ink-900">{formatDate(quotation.created_at)}</dd></div>
            <div><dt className="text-xs text-neutral-600">Valid until</dt><dd className={isExpired ? "text-terracotta-600" : "text-ink-900"}>{formatDate(quotation.valid_until)}</dd></div>
          </div>
          <dl className="space-y-1.5 border-t border-ink-900/8 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-neutral-600">Subtotal</dt><dd>{formatCurrency(quotation.subtotal, quotation.currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral-600">Delivery fee</dt><dd>{formatCurrency(quotation.delivery_fee, quotation.currency)}</dd></div>
            {quotation.discount > 0 && <div className="flex justify-between"><dt className="text-neutral-600">Discount</dt><dd>-{formatCurrency(quotation.discount, quotation.currency)}</dd></div>}
            <div className="flex justify-between border-t border-ink-900/8 pt-2 text-base font-medium text-ink-950"><dt>Total</dt><dd>{formatCurrency(quotation.total, quotation.currency)}</dd></div>
          </dl>
          {quotation.terms && <p className="border-t border-ink-900/8 pt-4 text-xs text-neutral-600">{quotation.terms}</p>}
        </CardBody>
      </Card>

      {quotation.status === "sent" && !isExpired && (
        <Card>
          <CardHeader><CardTitle>Your response</CardTitle></CardHeader>
          <CardBody><QuotationResponse quotationId={quotation.id} /></CardBody>
        </Card>
      )}

      {quotation.status === "accepted" && invoice && (
        <Card className="border-sage-500/40 bg-sage-500/5">
          <CardBody className="flex items-center justify-between py-4">
            <p className="text-sm text-ink-900">You accepted this quotation. Your invoice is ready.</p>
            <Button href={`/invoices/${invoice.id}`} size="sm" variant="gold">View invoice</Button>
          </CardBody>
        </Card>
      )}

      {quotation.status === "accepted" && !invoice && (
        <p className="text-sm text-neutral-600">You accepted this quotation. We&apos;re preparing your invoice.</p>
      )}

      {quotation.customer_response_note && (
        <Card>
          <CardHeader><CardTitle>Your note</CardTitle></CardHeader>
          <CardBody><p className="text-sm text-neutral-700">{quotation.customer_response_note}</p></CardBody>
        </Card>
      )}
    </div>
  );
}
