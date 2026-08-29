"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import { notifyAdmins, notifyUser, recordStatusEvent } from "@/lib/actions/system";

async function loadJobContext(jobId: string) {
  const supabase = await createClient();
  const { data: job } = await supabase
    .from("production_jobs")
    .select("*, order:orders(*, enquiry:enquiries(*, customer:customers(*)))")
    .eq("id", jobId)
    .single();
  return job;
}

export async function assignProductionStaffAction(formData: FormData) {
  await requireProfile("admin");
  const jobId = String(formData.get("job_id") || "");
  const staffId = String(formData.get("staff_id") || "") || null;
  if (!jobId) return;

  const adminDb = createAdminClient();
  const { data: job } = await adminDb.from("production_jobs").update({ assigned_to: staffId }).eq("id", jobId).select("order_id").single();
  await notifyUser({ userId: staffId, type: "job_assigned", title: "New production job assigned", body: "A production job has been assigned to you.", entityType: "production_job", entityId: jobId });
  if (job) revalidatePath(`/admin/production/${job.order_id}`);
}

export async function startProductionAction(formData: FormData) {
  const profile = await requireProfile("admin", "production");
  const jobId = String(formData.get("job_id") || "");
  const job = await loadJobContext(jobId);
  if (!job) return;

  const adminDb = createAdminClient();
  await adminDb.from("production_jobs").update({ stage: "in_production", started_at: new Date().toISOString() }).eq("id", jobId);
  await adminDb.from("orders").update({ status: "in_production" }).eq("id", job.order_id);
  await adminDb.from("enquiries").update({ status: "in_production" }).eq("id", job.order.enquiry_id);
  await recordStatusEvent({ entityType: "order", entityId: job.order_id, fromStatus: "production_authorised", toStatus: "in_production", actorId: profile.id });
  await notifyUser({ userId: job.order.enquiry.customer?.user_id ?? null, type: "production_started", title: "Production started", body: `Production has started on order ${job.order.order_number}.`, entityType: "order", entityId: job.order_id });

  revalidatePath(`/admin/production/${job.order_id}`);
  revalidatePath(`/production/${job.order_id}`);
  revalidatePath(`/orders/${job.order_id}`);
  revalidatePath("/orders");
  revalidatePath("/dashboard");
}

export async function addProductionNoteAction(formData: FormData) {
  const profile = await requireProfile("admin", "production");
  const jobId = String(formData.get("job_id") || "");
  const note = String(formData.get("note") || "").trim();
  if (!jobId || !note) return;

  const adminDb = createAdminClient();
  await adminDb.from("production_notes").insert({ production_job_id: jobId, note, created_by: profile.id });
  const { data: job } = await adminDb.from("production_jobs").select("order_id").eq("id", jobId).single();
  if (job) {
    revalidatePath(`/admin/production/${job.order_id}`);
    revalidatePath(`/production/${job.order_id}`);
  }
}

const ALLOWED_PHOTO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function uploadProductionPhotoAction(formData: FormData) {
  const profile = await requireProfile("admin", "production");
  const jobId = String(formData.get("job_id") || "");
  const caption = String(formData.get("caption") || "").trim();
  const file = formData.get("photo") as File | null;
  if (!jobId || !file || file.size === 0 || !ALLOWED_PHOTO_TYPES.has(file.type)) return;

  const adminDb = createAdminClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${jobId}/${randomUUID()}.${ext}`;
  const { error } = await adminDb.storage.from("production-photos").upload(path, file, { contentType: file.type });
  if (error) return;

  await adminDb.from("production_photos").insert({ production_job_id: jobId, file_path: path, caption: caption || null, created_by: profile.id });
  const { data: job } = await adminDb.from("production_jobs").select("order_id").eq("id", jobId).single();
  if (job) {
    revalidatePath(`/admin/production/${job.order_id}`);
    revalidatePath(`/production/${job.order_id}`);
    revalidatePath(`/orders/${job.order_id}`);
  }
}

export async function completeProductionAction(formData: FormData) {
  const profile = await requireProfile("admin", "production");
  const jobId = String(formData.get("job_id") || "");
  const job = await loadJobContext(jobId);
  if (!job) return;

  const adminDb = createAdminClient();
  await adminDb.from("production_jobs").update({ stage: "quality_check" }).eq("id", jobId);
  await adminDb.from("orders").update({ status: "quality_check" }).eq("id", job.order_id);
  await adminDb.from("enquiries").update({ status: "quality_check" }).eq("id", job.order.enquiry_id);
  await adminDb.from("qc_checklists").upsert({ production_job_id: jobId }, { onConflict: "production_job_id", ignoreDuplicates: true });
  await recordStatusEvent({ entityType: "order", entityId: job.order_id, fromStatus: "in_production", toStatus: "quality_check", actorId: profile.id });

  revalidatePath(`/admin/production/${job.order_id}`);
  revalidatePath(`/production/${job.order_id}`);
  revalidatePath(`/orders/${job.order_id}`);
  revalidatePath("/orders");
  revalidatePath("/dashboard");
}

const QC_FIELDS = [
  "correct_artwork",
  "correct_spelling",
  "correct_dimensions",
  "correct_colours",
  "correct_material",
  "correct_quantity",
  "acceptable_quality",
  "packaging_completed",
] as const;

export async function saveQcChecklistAction(formData: FormData) {
  const profile = await requireProfile("admin", "production");
  const jobId = String(formData.get("job_id") || "");
  if (!jobId) return;

  const checks = Object.fromEntries(QC_FIELDS.map((f) => [f, formData.get(f) === "on"]));
  const allPass = QC_FIELDS.every((f) => checks[f]);
  const notes = String(formData.get("notes") || "").trim();

  const adminDb = createAdminClient();
  await adminDb
    .from("qc_checklists")
    .upsert(
      { production_job_id: jobId, ...checks, notes: notes || null, overall_result: allPass ? "pass" : "fail", checked_by: profile.id, checked_at: new Date().toISOString() },
      { onConflict: "production_job_id" }
    );

  const { data: job } = await adminDb.from("production_jobs").select("order_id").eq("id", jobId).single();
  if (job) {
    revalidatePath(`/admin/production/${job.order_id}`);
    revalidatePath(`/production/${job.order_id}`);
  }
}

export async function markReadyForDispatchAction(formData: FormData) {
  const profile = await requireProfile("admin", "production");
  const jobId = String(formData.get("job_id") || "");
  const job = await loadJobContext(jobId);
  if (!job) return;

  const adminDb = createAdminClient();
  const { data: qc } = await adminDb.from("qc_checklists").select("overall_result").eq("production_job_id", jobId).maybeSingle();
  if (qc?.overall_result !== "pass") return;

  await adminDb.from("production_jobs").update({ stage: "ready_for_dispatch", completed_at: new Date().toISOString() }).eq("id", jobId);
  await adminDb.from("orders").update({ status: "ready_for_dispatch" }).eq("id", job.order_id);
  await adminDb.from("enquiries").update({ status: "ready_for_dispatch" }).eq("id", job.order.enquiry_id);
  await recordStatusEvent({ entityType: "order", entityId: job.order_id, fromStatus: "quality_check", toStatus: "ready_for_dispatch", actorId: profile.id });

  await notifyAdmins({ type: "ready_for_dispatch", title: "Order ready for dispatch", body: `${job.order.order_number} passed QC and is ready for dispatch.`, entityType: "order", entityId: job.order_id });
  await notifyUser({ userId: job.order.enquiry.customer?.user_id ?? null, type: "production_completed", title: "Your labels are ready", body: `Order ${job.order.order_number} passed quality control and is ready for dispatch.`, entityType: "order", entityId: job.order_id });

  revalidatePath(`/admin/production/${job.order_id}`);
  revalidatePath(`/production/${job.order_id}`);
  revalidatePath("/admin/dispatch");
  revalidatePath(`/orders/${job.order_id}`);
  revalidatePath("/orders");
  revalidatePath("/dashboard");
}
