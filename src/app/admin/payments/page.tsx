import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSignedFileUrl } from "@/lib/files";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PaymentReviewForm } from "@/components/domain/payment-review-form";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/currency";

export const metadata: Metadata = { title: "Payment verification — Feyse Clothing Labels" };

export default async function PaymentVerificationPage() {
  const supabase = await createClient();

  const { data: pending } = await supabase
    .from("payments")
    .select("*, invoice:invoices(invoice_number, total, currency, enquiry:enquiries(enquiry_number, customer:customers(full_name, business_name)))")
    .eq("status", "submitted")
    .order("created_at", { ascending: true });

  const { data: recentlyReviewed } = await supabase
    .from("payments")
    .select("*, invoice:invoices(invoice_number)")
    .in("status", ["confirmed", "rejected"])
    .order("reviewed_at", { ascending: false })
    .limit(8);

  const withUrls = await Promise.all(
    (pending ?? []).map(async (p) => ({ ...p, evidenceUrl: await getSignedFileUrl("payment-evidence", p.evidence_file_path) }))
  );

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">Verification queue</p>
        <h1 className="mt-1 font-serif text-3xl text-ink-950">Payments awaiting verification</h1>
      </div>

      {withUrls.length ? (
        <div className="space-y-4">
          {withUrls.map((p) => (
            <Card key={p.id}>
              <CardBody className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink-900">
                      {p.invoice.enquiry.customer?.business_name || p.invoice.enquiry.customer?.full_name} — {p.invoice.invoice_number}
                    </p>
                    <p className="text-xs text-neutral-500">Enquiry {p.invoice.enquiry.enquiry_number} · submitted {formatDateTime(p.created_at)}</p>
                  </div>
                  <p className="font-serif text-lg text-ink-950">{formatCurrency(p.amount_paid, p.invoice.currency)}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <dl className="space-y-1 text-sm">
                    <div className="flex justify-between"><dt className="text-neutral-500">Invoice total</dt><dd>{formatCurrency(p.invoice.total, p.invoice.currency)}</dd></div>
                    <div className="flex justify-between"><dt className="text-neutral-500">Payment date</dt><dd>{formatDate(p.payment_date)}</dd></div>
                    <div className="flex justify-between"><dt className="text-neutral-500">Sender name</dt><dd>{p.sender_account_name}</dd></div>
                    {p.sender_bank && <div className="flex justify-between"><dt className="text-neutral-500">Sender bank</dt><dd>{p.sender_bank}</dd></div>}
                  </dl>
                  {p.evidenceUrl && (
                    <a href={p.evidenceUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-xl border border-ink-900/8 bg-cream-200/40 p-3 text-sm font-medium text-terracotta-600 hover:bg-cream-200">
                      View proof of payment ↗
                    </a>
                  )}
                </div>
                <div className="border-t border-ink-900/8 pt-3">
                  <PaymentReviewForm paymentId={p.id} />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Wallet} title="All caught up" description="No payment evidence is currently awaiting verification." />
      )}

      {!!recentlyReviewed?.length && (
        <section>
          <h2 className="mb-3 font-serif text-lg text-ink-950">Recently reviewed</h2>
          <div className="overflow-hidden rounded-2xl border border-ink-900/8 bg-cream-50">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-ink-900/8 bg-cream-200/50 text-left text-xs text-neutral-500">
                <tr><th className="px-4 py-3 font-medium">Invoice</th><th className="px-4 py-3 font-medium">Amount</th><th className="px-4 py-3 font-medium">Decision</th><th className="px-4 py-3 font-medium">Date</th></tr>
              </thead>
              <tbody>
                {recentlyReviewed.map((p) => (
                  <tr key={p.id} className="border-b border-ink-900/6 last:border-0">
                    <td className="px-4 py-3 text-ink-900">{p.invoice.invoice_number}</td>
                    <td className="px-4 py-3">{formatCurrency(p.amount_paid)}</td>
                    <td className="px-4 py-3 capitalize">{p.status}</td>
                    <td className="px-4 py-3 text-neutral-500">{formatDate(p.reviewed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
