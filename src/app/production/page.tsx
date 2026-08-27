import type { Metadata } from "next";
import Link from "next/link";
import { Factory } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/domain/status-badge";
import { formatDate } from "@/lib/currency";
import { describeSpec } from "@/lib/spec";

export const metadata: Metadata = { title: "My production jobs — Feyse Clothing Labels" };

export default async function ProductionJobListPage() {
  const profile = await requireProfile("production", "admin");
  const supabase = await createClient();

  let query = supabase.from("production_jobs").select("*, order:orders(*, enquiry:enquiries(*))").neq("stage", "completed").order("created_at", { ascending: true });
  if (profile.role === "production") query = query.eq("assigned_to", profile.id);
  const { data: jobs } = await query;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">Production</p>
        <h1 className="mt-1 font-serif text-3xl text-ink-950">My jobs</h1>
      </div>

      {jobs?.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {jobs.map((job) => (
            <Link key={job.id} href={`/production/${job.order_id}`} className="block rounded-2xl border border-ink-900/8 bg-cream-50 p-5 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="font-medium text-ink-900">{job.order.order_number}</p>
                <StatusBadge status={job.order.status} />
              </div>
              <p className="mt-1.5 text-sm text-neutral-600">{describeSpec(job.order.enquiry)}</p>
              <p className="mt-2 text-xs text-neutral-500">Quantity {job.order.enquiry.quantity} · Deadline {formatDate(job.order.production_deadline)}</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon={Factory} title="No jobs assigned" description="Authorised production jobs assigned to you will appear here." />
      )}
    </div>
  );
}
