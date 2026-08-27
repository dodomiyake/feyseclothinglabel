import type { Metadata } from "next";
import Link from "next/link";
import { Factory } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/domain/status-badge";
import { formatDate } from "@/lib/currency";
import { describeSpec } from "@/lib/spec";

export const metadata: Metadata = { title: "Production board — Feyse Clothing Labels" };

const STAGE_LABEL: Record<string, string> = {
  not_started: "Not started",
  in_production: "In production",
  quality_check: "Quality check",
  ready_for_dispatch: "Ready for dispatch",
  completed: "Completed",
};

export default async function AdminProductionBoardPage() {
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("production_jobs")
    .select("*, order:orders(*, enquiry:enquiries(*)), assignee:profiles!production_jobs_assigned_to_fkey(full_name)")
    .neq("stage", "completed")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">Production</p>
        <h1 className="mt-1 font-serif text-3xl text-ink-950">Production board</h1>
      </div>

      {jobs?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Link key={job.id} href={`/admin/production/${job.order_id}`} className="block rounded-2xl border border-ink-900/8 bg-cream-50 p-5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink-900">{job.order.order_number}</p>
                <StatusBadge status={job.order.status} />
              </div>
              <p className="mt-1.5 text-sm text-neutral-600">{describeSpec(job.order.enquiry)}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                <span>{job.assignee?.full_name ?? "Unassigned"}</span>
                <span>Deadline {formatDate(job.order.production_deadline)}</span>
              </div>
              <p className="mt-2 text-xs font-medium text-gold-700">{STAGE_LABEL[job.stage]}</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={Factory} title="No active production jobs" description="Jobs appear here once payment is confirmed and production is authorised." />
      )}
    </div>
  );
}
