import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/domain/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Inbox as InboxIcon } from "lucide-react";
import { formatDate } from "@/lib/currency";
import { describeSpec } from "@/lib/spec";
import { STATUS_META } from "@/lib/workflow";
import type { WorkflowStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Enquiry inbox — Feyse Clothing Labels" };

const FILTERS: { label: string; value: string }[] = [
  { label: "All active", value: "active" },
  { label: "New", value: "submitted" },
  { label: "Under review", value: "under_review" },
  { label: "Changes requested", value: "changes_requested" },
  { label: "Quotation sent", value: "quotation_sent" },
  { label: "Drafts", value: "draft" },
];

export default async function AdminInboxPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "active" } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("enquiries").select("*, customer:customers(full_name, business_name, whatsapp_number)").order("created_at", { ascending: false });
  if (status === "active") {
    query = query.not("status", "in", "(draft,completed,cancelled,quotation_declined,delivered,refunded)");
  } else {
    query = query.eq("status", status);
  }
  const { data: enquiries } = await query.limit(50);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">Inbox</p>
          <h1 className="mt-1 font-serif text-3xl text-ink-950">Enquiries</h1>
        </div>
        <Button href="/admin/enquiries/new" variant="gold">
          <Plus className="h-4 w-4" /> Log a WhatsApp enquiry
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/inbox?status=${f.value}`}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${status === f.value ? "bg-ink-900 text-cream-50" : "bg-ink-900/5 text-ink-700 hover:bg-ink-900/10"}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {enquiries?.length ? (
        <div className="overflow-hidden rounded-2xl border border-ink-900/8 bg-cream-50">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-900/8 bg-cream-200/50 text-left text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Specification</th>
                <th className="px-4 py-3 font-medium">Received</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((e) => (
                <tr key={e.id} className="border-b border-ink-900/6 last:border-0 hover:bg-cream-200/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/enquiries/${e.id}`} className="font-medium text-ink-900 hover:text-terracotta-600">
                      {e.customer?.business_name || e.customer?.full_name}
                    </Link>
                    <p className="text-xs text-neutral-500">{e.customer?.whatsapp_number}</p>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{e.enquiry_number}</td>
                  <td className="px-4 py-3 text-neutral-600">{describeSpec(e)}</td>
                  <td className="px-4 py-3 text-neutral-600">{formatDate(e.submitted_at ?? e.created_at)}</td>
                  <td className="px-4 py-3"><StatusBadge status={e.status as WorkflowStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={InboxIcon} title="Nothing here" description={`No enquiries with status "${STATUS_META[status as WorkflowStatus]?.label ?? status}".`} />
      )}
    </div>
  );
}
