import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSignedFileUrl } from "@/lib/files";

export async function loadProductionJobByOrderId(orderId: string) {
  const supabase = await createClient();

  const { data: order } = await supabase.from("orders").select("*, enquiry:enquiries(*)").eq("id", orderId).maybeSingle();
  if (!order) return null;

  const { data: job } = await supabase.from("production_jobs").select("*").eq("order_id", orderId).maybeSingle();
  if (!job) return null;

  const [{ data: notes }, { data: photos }, { data: qc }] = await Promise.all([
    supabase.from("production_notes").select("*").eq("production_job_id", job.id).order("created_at", { ascending: false }),
    supabase.from("production_photos").select("*").eq("production_job_id", job.id).order("created_at", { ascending: false }),
    supabase.from("qc_checklists").select("*").eq("production_job_id", job.id).maybeSingle(),
  ]);

  const photoUrls = await Promise.all(
    (photos ?? []).map(async (p) => ({ id: p.id, url: await getSignedFileUrl("production-photos", p.file_path), caption: p.caption, created_at: p.created_at }))
  );

  return { order, enquiry: order.enquiry, job, notes: notes ?? [], photoUrls, qc: qc ?? null };
}
