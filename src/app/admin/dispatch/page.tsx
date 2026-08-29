import type { Metadata } from "next";
import Link from "next/link";
import { Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/domain/status-badge";
import { describeSpec } from "@/lib/spec";
import { formatDate } from "@/lib/currency";

export const metadata: Metadata = { title: "Dispatch management — Feyse Clothing Labels" };

export default async function AdminDispatchPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*, enquiry:enquiries(*, customer:customers(full_name, business_name)), dispatch:dispatches(*)")
    .in("status", ["ready_for_dispatch", "out_for_delivery", "delivery_unsuccessful"])
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">Dispatch</p>
        <h1 className="mt-1 font-serif text-3xl text-ink-950">Dispatch management</h1>
      </div>

      {orders?.length ? (
        <div className="overflow-hidden rounded-2xl border border-ink-900/8 bg-cream-50">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-ink-900/8 bg-cream-200/50 text-left text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Rider</th>
                <th className="px-4 py-3 font-medium">Deadline</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-ink-900/6 last:border-0 hover:bg-cream-200/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/dispatch/${o.id}`} className="font-medium text-ink-900 hover:text-terracotta-600">{o.order_number}</Link>
                    <p className="text-xs text-neutral-500">{describeSpec(o.enquiry)}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{o.enquiry.customer?.business_name || o.enquiry.customer?.full_name}</td>
                  <td className="px-4 py-3 text-neutral-600">{o.dispatch?.rider_name ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-600">{formatDate(o.production_deadline)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <EmptyState icon={Truck} title="Nothing to dispatch" description="Orders that pass quality control will appear here, ready to be handed to a rider." />
      )}
    </div>
  );
}
