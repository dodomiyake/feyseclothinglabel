import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { StatusBadge } from "@/components/domain/status-badge";
import { formatCurrency, formatDate } from "@/lib/currency";
import { describeSpec } from "@/lib/spec";

export const metadata: Metadata = { title: "Admin dashboard — Feyse Clothing Labels" };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function count(supabase: Awaited<ReturnType<typeof createClient>>, table: string, filters: (q: any) => any) {
  const { count } = await filters(supabase.from(table).select("id", { count: "exact", head: true }));
  return count ?? 0;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  // eslint-disable-next-line react-hooks/purity -- server component, evaluated once per request
  const threeDaysOut = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [
    newEnquiries,
    quotationsAwaiting,
    unpaidInvoices,
    paymentsAwaiting,
    inProduction,
    readyForDispatch,
    activeDeliveries,
    approachingDeadline,
    { data: recentEnquiries },
    { data: recentCompleted },
    { data: monthPayments },
  ] = await Promise.all([
    count(supabase, "enquiries", (q) => q.in("status", ["submitted", "under_review"])),
    count(supabase, "quotations", (q) => q.eq("status", "sent")),
    count(supabase, "invoices", (q) => q.in("status", ["issued", "awaiting_payment", "payment_rejected"])),
    count(supabase, "payments", (q) => q.eq("status", "submitted")),
    count(supabase, "orders", (q) => q.in("status", ["in_production", "quality_check"])),
    count(supabase, "orders", (q) => q.eq("status", "ready_for_dispatch")),
    count(supabase, "orders", (q) => q.eq("status", "out_for_delivery")),
    count(supabase, "orders", (q) => q.lte("production_deadline", threeDaysOut).not("status", "in", "(completed,cancelled,refunded,delivered)")),
    supabase.from("enquiries").select("*, customer:customers(full_name, business_name)").in("status", ["submitted", "under_review"]).order("created_at", { ascending: false }).limit(5),
    supabase.from("orders").select("*, enquiry:enquiries(enquiry_number)").eq("status", "completed").order("updated_at", { ascending: false }).limit(5),
    supabase.from("payments").select("amount_paid").eq("status", "confirmed").gte("reviewed_at", monthStart),
  ]);

  const revenueThisMonth = (monthPayments ?? []).reduce((sum, p) => sum + Number(p.amount_paid), 0);

  const stats = [
    { label: "New enquiries", value: newEnquiries, href: "/admin/inbox?status=submitted" },
    { label: "Quotations awaiting response", value: quotationsAwaiting, href: "/admin/inbox" },
    { label: "Unpaid invoices", value: unpaidInvoices, href: "/admin/payments" },
    { label: "Payments to verify", value: paymentsAwaiting, href: "/admin/payments" },
    { label: "In production", value: inProduction, href: "/admin/production" },
    { label: "Ready for dispatch", value: readyForDispatch, href: "/admin/dispatch" },
    { label: "Active deliveries", value: activeDeliveries, href: "/admin/dispatch" },
    { label: "Deadlines within 3 days", value: approachingDeadline, href: "/admin/production" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">Overview</p>
        <h1 className="mt-1 font-serif text-3xl text-ink-950">Operations dashboard</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardBody className="py-4">
                <p className="font-serif text-3xl text-ink-950">{s.value}</p>
                <p className="mt-1 text-xs text-neutral-500">{s.label}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardBody className="flex items-center justify-between py-5">
          <div>
            <p className="text-xs text-neutral-500">Revenue confirmed this month</p>
            <p className="font-serif text-3xl text-ink-950">{formatCurrency(revenueThisMonth)}</p>
          </div>
          <Link href="/admin/payments" className="text-sm font-medium text-terracotta-600 hover:text-terracotta-700">
            View payments →
          </Link>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-lg text-ink-950">New enquiries</h2>
            <Link href="/admin/inbox" className="text-sm font-medium text-terracotta-600 hover:text-terracotta-700">View inbox →</Link>
          </div>
          {recentEnquiries?.length ? (
            <div className="space-y-2">
              {recentEnquiries.map((e) => (
                <Link key={e.id} href={`/admin/enquiries/${e.id}`} className="block rounded-xl border border-ink-900/8 bg-cream-50 p-4 hover:shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink-900">{e.customer?.business_name || e.customer?.full_name} · {e.enquiry_number}</p>
                    <StatusBadge status={e.status} />
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">{describeSpec(e)}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No new enquiries right now.</p>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-lg text-ink-950">Recently completed</h2>
          </div>
          {recentCompleted?.length ? (
            <div className="space-y-2">
              {recentCompleted.map((o) => (
                <Link key={o.id} href={`/admin/enquiries/${o.enquiry_id}`} className="flex items-center justify-between rounded-xl border border-ink-900/8 bg-cream-50 p-4 hover:shadow-sm">
                  <p className="text-sm font-medium text-ink-900">{o.order_number}</p>
                  <p className="text-xs text-neutral-500">{formatDate(o.updated_at)}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No completed orders yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
