import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, FileText, Inbox, Package, Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/domain/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/currency";
import { describeSpec } from "@/lib/spec";
import type { Enquiry, Invoice, Order, Quotation } from "@/lib/types";

export const metadata: Metadata = { title: "My dashboard — Feyse Clothing Labels" };

export default async function CustomerDashboardPage() {
  const profile = await requireProfile("customer");
  const supabase = await createClient();

  const { data: customer } = await supabase.from("customers").select("id").eq("user_id", profile.id).maybeSingle();

  if (!customer) {
    return (
      <EmptyState
        icon={Inbox}
        title="No customer record yet"
        description="Submit your first enquiry to get started."
        action={<Button href="/enquiry">Start an enquiry</Button>}
      />
    );
  }

  const [{ data: enquiries }, { data: quotationsAwaiting }, { data: invoicesAwaiting }, { data: activeOrders }] = await Promise.all([
    supabase.from("enquiries").select("*").eq("customer_id", customer.id).order("created_at", { ascending: false }).limit(6),
    supabase
      .from("quotations")
      .select("*, enquiry:enquiries!inner(customer_id)")
      .eq("status", "sent")
      .eq("enquiry.customer_id", customer.id),
    supabase
      .from("invoices")
      .select("*, enquiry:enquiries!inner(customer_id)")
      .in("status", ["issued", "awaiting_payment", "payment_rejected"])
      .eq("enquiry.customer_id", customer.id),
    supabase
      .from("orders")
      .select("*, enquiry:enquiries!inner(customer_id)")
      .not("status", "in", "(completed,cancelled,refunded)")
      .eq("enquiry.customer_id", customer.id)
      .order("created_at", { ascending: false }),
  ]);

  const needsAttention = [
    ...((quotationsAwaiting as (Quotation & { enquiry: { customer_id: string } })[] | null) ?? []).map((q) => ({
      kind: "quotation" as const,
      href: `/quotations/${q.id}`,
      title: `Quotation ${q.quotation_number} awaiting your response`,
      meta: `${formatCurrency(q.total, q.currency)} · valid until ${formatDate(q.valid_until)}`,
    })),
    ...((invoicesAwaiting as (Invoice & { enquiry: { customer_id: string } })[] | null) ?? []).map((inv) => ({
      kind: "invoice" as const,
      href: inv.status === "payment_rejected" ? `/invoices/${inv.id}/pay` : `/invoices/${inv.id}`,
      title:
        inv.status === "payment_rejected"
          ? `Payment evidence rejected for invoice ${inv.invoice_number}`
          : `Invoice ${inv.invoice_number} awaiting payment`,
      meta: `${formatCurrency(inv.total, inv.currency)} · due ${formatDate(inv.due_date)}`,
    })),
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.3em] text-gold-700 uppercase">Overview</p>
          <h1 className="mt-1 font-serif text-3xl text-ink-950">Your dashboard</h1>
        </div>
        <Button href="/enquiry" variant="gold">New enquiry</Button>
      </div>

      {needsAttention.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-serif text-lg text-ink-950">
            <AlertCircle className="h-4 w-4 text-terracotta-600" /> Needs your attention
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {needsAttention.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="border-terracotta-400/40 bg-terracotta-400/5 transition-shadow hover:shadow-md">
                  <CardBody className="py-4">
                    <p className="text-sm font-medium text-ink-900">{item.title}</p>
                    <p className="mt-1 text-xs text-neutral-600">{item.meta}</p>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-serif text-lg text-ink-950">
          <Package className="h-4 w-4 text-gold-700" /> Active orders
        </h2>
        {activeOrders?.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {(activeOrders as (Order & { enquiry: { customer_id: string } })[]).map((order) => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardBody className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium text-ink-900">{order.order_number}</p>
                      <p className="text-xs text-neutral-600">Deadline {formatDate(order.production_deadline)}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon={Package} title="No active orders" description="Orders appear here once payment is confirmed and production begins." />
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-serif text-lg text-ink-950">
            <FileText className="h-4 w-4 text-gold-700" /> Recent enquiries
          </h2>
          <Link href="/orders" className="text-sm font-medium text-terracotta-600 hover:text-terracotta-700">
            View order history →
          </Link>
        </div>
        {enquiries?.length ? (
          <div className="overflow-hidden rounded-2xl border border-ink-900/8 bg-cream-50">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="border-b border-ink-900/8 bg-cream-200/50 text-left text-xs text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Specification</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(enquiries as Enquiry[]).map((e) => (
                  <tr key={e.id} className="border-b border-ink-900/6 last:border-0 hover:bg-cream-200/30">
                    <td className="px-4 py-3">
                      <Link href={e.status === "draft" ? `/enquiry?draft=${e.id}` : `/enquiries/${e.id}`} className="font-medium text-ink-900 hover:text-terracotta-600">
                        {e.enquiry_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{describeSpec(e)}</td>
                    <td className="px-4 py-3 text-neutral-600">{formatDate(e.submitted_at ?? e.created_at)}</td>
                    <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Receipt}
            title="No enquiries yet"
            description="Once you submit an enquiry, you'll be able to track its progress here."
            action={<Button href="/enquiry">Start an enquiry</Button>}
          />
        )}
      </section>
    </div>
  );
}
