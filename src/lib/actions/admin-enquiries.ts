"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import { notifyUser, recordStatusEvent } from "@/lib/actions/system";
import type { WorkflowStatus } from "@/lib/types";

export interface AdminActionState {
  error?: string;
}

export async function createWalkInEnquiryAction(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const admin = await requireProfile("admin");
  const raw = Object.fromEntries(formData.entries());

  const fullName = String(raw.full_name || "").trim();
  const whatsapp = String(raw.whatsapp_number || "").trim();
  if (!fullName || !whatsapp) return { error: "Customer name and WhatsApp number are required." };

  const adminDb = createAdminClient();

  let customerId = String(raw.customer_id || "");
  if (!customerId) {
    const { data: existing } = await adminDb.from("customers").select("id").eq("whatsapp_number", whatsapp).maybeSingle();
    if (existing) {
      customerId = existing.id;
    } else {
      const { data: created, error } = await adminDb
        .from("customers")
        .insert({
          full_name: fullName,
          business_name: String(raw.business_name || "").trim() || null,
          email: String(raw.email || "").trim() || null,
          whatsapp_number: whatsapp,
          delivery_phone: String(raw.delivery_phone || whatsapp).trim(),
          source: "whatsapp",
          created_by: admin.id,
        })
        .select("id")
        .single();
      if (error || !created) {
        console.error("[createWalkInEnquiryAction] failed to create customer:", error);
        return { error: "Could not create the customer record." };
      }
      customerId = created.id;
    }
  }

  const { data: enquiry, error } = await adminDb
    .from("enquiries")
    .insert({
      customer_id: customerId,
      status: "submitted",
      label_type: raw.label_type || null,
      material: raw.material || null,
      width: raw.width ? Number(raw.width) : null,
      height: raw.height ? Number(raw.height) : null,
      measurement_unit: raw.measurement_unit || "cm",
      quantity: raw.quantity ? Number(raw.quantity) : null,
      background_colour: raw.background_colour || null,
      text_colour: raw.text_colour || null,
      fold_type: raw.fold_type || null,
      additional_instructions: raw.additional_instructions || null,
      delivery_address: raw.delivery_address || null,
      delivery_city: raw.delivery_city || null,
      delivery_state: raw.delivery_state || null,
      delivery_phone: String(raw.delivery_phone || whatsapp).trim(),
      required_date: raw.required_date || null,
      created_by: admin.id,
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !enquiry) {
    console.error("[createWalkInEnquiryAction] failed to create enquiry:", error);
    return { error: "Could not create the enquiry. Please try again." };
  }

  if (raw.whatsapp_note) {
    await adminDb.from("whatsapp_notes").insert({ enquiry_id: enquiry.id, direction: "inbound", note: String(raw.whatsapp_note), created_by: admin.id });
  }

  await recordStatusEvent({ entityType: "enquiry", entityId: enquiry.id, fromStatus: null, toStatus: "submitted", actorId: admin.id, note: "Logged from a WhatsApp conversation." });

  redirect(`/admin/enquiries/${enquiry.id}`);
}

export async function updateEnquiryStatusAction(formData: FormData) {
  const admin = await requireProfile("admin");
  const enquiryId = String(formData.get("enquiry_id") || "");
  const toStatus = String(formData.get("status") || "") as WorkflowStatus;
  const note = String(formData.get("note") || "").trim();
  if (!enquiryId || !toStatus) return;

  const supabase = await createClient();
  const { data: enquiry } = await supabase.from("enquiries").select("status, customer:customers(user_id)").eq("id", enquiryId).single();
  if (!enquiry) return;

  const adminDb = createAdminClient();
  await adminDb.from("enquiries").update({ status: toStatus, reviewed_at: new Date().toISOString() }).eq("id", enquiryId);
  await recordStatusEvent({ entityType: "enquiry", entityId: enquiryId, fromStatus: enquiry.status, toStatus, actorId: admin.id, note: note || undefined });

  if (toStatus === "changes_requested") {
    await notifyUser({
      userId: (enquiry.customer as unknown as { user_id: string | null } | null)?.user_id ?? null,
      type: "changes_requested",
      title: "We need a bit more information",
      body: note || "Please review your enquiry — we need some additional details.",
      entityType: "enquiry",
      entityId: enquiryId,
    });
  }

  revalidatePath(`/admin/enquiries/${enquiryId}`);
  revalidatePath(`/enquiries/${enquiryId}`);
  revalidatePath("/dashboard");
}

/**
 * Called from the enquiry workspace page itself: the first time an admin
 * opens a freshly-submitted enquiry, it silently becomes "under review" —
 * no separate manual click needed. The `.eq("status", "submitted")` guard
 * makes this idempotent (a prefetch or a second render can't double-fire
 * it, since only the first write still matches that WHERE clause).
 */
export async function autoMarkUnderReview(enquiryId: string, adminId: string) {
  const adminDb = createAdminClient();
  const { data, error } = await adminDb
    .from("enquiries")
    .update({ status: "under_review", reviewed_at: new Date().toISOString() })
    .eq("id", enquiryId)
    .eq("status", "submitted")
    .select("id")
    .maybeSingle();
  if (!error && data) {
    await recordStatusEvent({ entityType: "enquiry", entityId: enquiryId, fromStatus: "submitted", toStatus: "under_review", actorId: adminId, note: "Opened by admin." });
  }
}

export async function addWhatsappNoteAction(formData: FormData) {
  const admin = await requireProfile("admin");
  const enquiryId = String(formData.get("enquiry_id") || "");
  const note = String(formData.get("note") || "").trim();
  const direction = String(formData.get("direction") || "inbound");
  if (!enquiryId || !note) return;

  const adminDb = createAdminClient();
  await adminDb.from("whatsapp_notes").insert({ enquiry_id: enquiryId, note, direction, created_by: admin.id });
  revalidatePath(`/admin/enquiries/${enquiryId}`);
}
