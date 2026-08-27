import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/currency";
import { describeSpec } from "@/lib/spec";

export const metadata: Metadata = { title: "Invoice — Feyse Clothing Labels" };

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireProfile("customer");
  const supabase = await createClient();

  const { data: invoice } = await supabase.from("invoices").select("*, enquiry:enquiries(*)").eq("id", id).maybeSingle();
  if (!invoice) notFound();

  const [{ data: bankAccounts }, { data: payments }] = await Promise.all([
    supabase.from("bank_accounts").select("*").eq("active", true),
    supabase.from("payments").select("*").eq("invoice_id", id).order("created_at", { ascending: false }),
  ]);

  const spec = describeSpec(invoice.enquiry);
  const latestPayment = payments?.[0];
  const canSubmitPayment = ["issued", "awaiting_payment", "payment_rejected"].includes(invoice.status);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">Invoice</p>
          <h1 className="mt-1 font-serif text-3xl text-ink-950">{invoice.invoice_number}</h1>
          <p className="mt-1 text-sm text-neutral-500">For enquiry {invoice.enquiry.enquiry_number}</p>
        </div>
        <StatusBadge status={invoice.enquiry.status} className="text-sm" />
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Summary</CardTitle>
          <a href={`/api/pdf/invoice/${invoice.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-terracotta-600 hover:text-terracotta-700">
            <Download className="h-3.5 w-3.5" /> Download PDF
          </a>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-ink-800">{spec}</p>
          <div className="grid grid-cols-2 gap-y-2 border-t border-ink-900/8 pt-4 text-sm">
            <div><dt className="text-xs text-neutral-500">Issue date</dt><dd className="text-ink-900">{formatDate(invoice.issue_date)}</dd></div>
            <div><dt className="text-xs text-neutral-500">Due date</dt><dd className="text-ink-900">{formatDate(invoice.due_date)}</dd></div>
          </div>
          <dl className="space-y-1.5 border-t border-ink-900/8 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-neutral-500">Subtotal</dt><dd>{formatCurrency(invoice.subtotal, invoice.currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral-500">Delivery fee</dt><dd>{formatCurrency(invoice.delivery_fee, invoice.currency)}</dd></div>
            {invoice.discount > 0 && <div className="flex justify-between"><dt className="text-neutral-500">Discount</dt><dd>-{formatCurrency(invoice.discount, invoice.currency)}</dd></div>}
            <div className="flex justify-between border-t border-ink-900/8 pt-2 text-base font-medium text-ink-950"><dt>Total due</dt><dd>{formatCurrency(invoice.total, invoice.currency)}</dd></div>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Nigerian bank transfer details</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          {bankAccounts?.map((b) => (
            <div key={b.id} className="rounded-xl bg-cream-200/50 p-4 text-sm">
              <p className="font-medium text-ink-900">{b.bank_name}</p>
              <p className="text-neutral-600">{b.account_name}</p>
              <p className="font-mono text-ink-900">{b.account_number}</p>
            </div>
          ))}
          <p className="text-xs text-neutral-500">
            Please use <span className="font-medium text-ink-800">{invoice.invoice_number}</span> as your transfer
            narration, then submit your proof of payment below.
          </p>
        </CardBody>
      </Card>

      {latestPayment && (
        <Card>
          <CardHeader><CardTitle>Payment status</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-neutral-500">Amount submitted</dt><dd>{formatCurrency(latestPayment.amount_paid, invoice.currency)}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral-500">Submitted on</dt><dd>{formatDate(latestPayment.payment_date)}</dd></div>
            <div className="flex justify-between"><dt className="text-neutral-500">Status</dt><dd className="capitalize">{latestPayment.status.replace("_", " ")}</dd></div>
            {latestPayment.status === "rejected" && latestPayment.rejection_reason && (
              <p className="rounded-lg bg-terracotta-600/10 px-3 py-2 text-terracotta-700">{latestPayment.rejection_reason}</p>
            )}
          </CardBody>
        </Card>
      )}

      {canSubmitPayment && (
        <Button href={`/invoices/${invoice.id}/pay`} size="lg" variant="gold" className="w-full">
          {latestPayment?.status === "rejected" ? "Re-submit proof of payment" : "Submit proof of payment"}
        </Button>
      )}
    </div>
  );
}
