import type { Metadata } from "next";
import Link from "next/link";
import { Package, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { reorderAction } from "@/lib/actions/orders";
import { formatCurrency, formatDate } from "@/lib/currency";
import { describeSpec } from "@/lib/spec";
import { isTerminalStatus } from "@/lib/workflow";

export const metadata: Metadata = { title: "Order history — Feyse Clothing Labels" };

export default async function OrderHistoryPage() {
  await requireProfile("customer");
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, enquiry:enquiries(*), invoice:invoices(total, currency)")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <p className="text-xs tracking-[0.3em] text-gold-700 uppercase">History</p>
        <h1 className="mt-1 font-serif text-3xl text-ink-950">Order history</h1>
      </div>

      {orders?.length ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-ink-900/8 bg-cream-50 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/orders/${order.id}`} className="font-medium text-ink-900 hover:text-terracotta-600">{order.order_number}</Link>
                  <p className="mt-0.5 text-sm text-neutral-600">{describeSpec(order.enquiry)}</p>
                  <p className="mt-1 text-xs text-neutral-400">Placed {formatDate(order.created_at)} · {formatCurrency(order.invoice.total, order.invoice.currency)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                </div>
              </div>
              <div className="mt-3 flex gap-2 border-t border-ink-900/8 pt-3">
                {!isTerminalStatus(order.status) && (
                  <Button href={`/orders/${order.id}`} size="sm" variant="outline">Track order</Button>
                )}
                <form action={reorderAction}>
                  <input type="hidden" name="enquiry_id" value={order.enquiry_id} />
                  <Button type="submit" size="sm" variant="ghost">
                    <RotateCcw className="h-3.5 w-3.5" /> Reorder
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Package} title="No orders yet" description="Your paid orders will appear here once payment has been verified." action={<Button href="/enquiry">Start an enquiry</Button>} />
      )}
    </div>
  );
}
