import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { InvoiceBuilderForm } from "@/components/domain/invoice-builder-form";
import { formatCurrency } from "@/lib/currency";

export const metadata: Metadata = { title: "Invoice builder — Feyse Clothing Labels" };

export default async function InvoiceBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quotation } = await supabase.from("quotations").select("*, enquiry:enquiries(*, customer:customers(*))").eq("id", id).maybeSingle();
  if (!quotation) notFound();

  const { data: existingInvoice } = await supabase.from("invoices").select("id").eq("quotation_id", id).maybeSingle();
  if (existingInvoice) redirect(`/admin/enquiries/${quotation.enquiry_id}`);

  const [{ data: bankAccounts }, { data: business }] = await Promise.all([
    supabase.from("bank_accounts").select("*").eq("active", true),
    supabase.from("business_settings").select("*").single(),
  ]);

  // eslint-disable-next-line react-hooks/purity -- server component, evaluated once per request
  const dueDate = new Date(Date.now() + (business?.default_invoice_due_days ?? 3) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return (
    <div className="max-w-2xl space-y-6">
      <Breadcrumb
        items={[
          { label: "Inbox", href: "/admin/inbox" },
          { label: quotation.enquiry.enquiry_number, href: `/admin/enquiries/${quotation.enquiry_id}` },
          { label: "Invoice" },
        ]}
      />

      <div>
        <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">Invoice builder</p>
        <h1 className="mt-1 font-serif text-3xl text-ink-950">{quotation.quotation_number}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {quotation.enquiry.customer?.business_name || quotation.enquiry.customer?.full_name} — {formatCurrency(quotation.total, quotation.currency)}
        </p>
      </div>
      <Card>
        <CardHeader><CardTitle>Invoice details</CardTitle></CardHeader>
        <CardBody>
          <InvoiceBuilderForm quotationId={id} bankAccounts={bankAccounts ?? []} defaultDueDate={dueDate} defaultTerms={business?.invoice_terms ?? ""} />
        </CardBody>
      </Card>
    </div>
  );
}
