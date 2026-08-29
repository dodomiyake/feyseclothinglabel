"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import { quotationSchema } from "@/lib/validation";
import { notifyAdmins, notifyUser, recordStatusEvent } from "@/lib/actions/system";
import type { WorkflowStatus } from "@/lib/types";

export interface QuotationActionState {
  error?: string;
}

// ---------------------------------------------------------------------
// Admin: create + send a quotation for an enquiry
// ---------------------------------------------------------------------
export async function createQuotationAction(_prev: QuotationActionState, formData: FormData): Promise<QuotationActionState> {
  const admin = await requireProfile("admin");
  const enquiryId = String(formData.get("enquiry_id") || "");
  const raw = Object.fromEntries(formData.entries());
  const parsed = quotationSchema.safeParse(raw);
  if (!parsed.success || !enquiryId) return { error: "Please fill in all required quotation fields." };

  const supabase = await createClient();
  const { data: enquiry } = await supabase.from("enquiries").select("*, customer:customers(*)").eq("id", enquiryId).single();
  if (!enquiry) return { error: "Enquiry not found." };

  const { unit_price, quantity, delivery_fee, discount, valid_until, terms } = parsed.data;
  const subtotal = unit_price * quantity;
  const total = subtotal + delivery_fee - discount;

  const { data: quotation, error } = await supabase
    .from("quotations")
    .insert({
      enquiry_id: enquiryId,
      status: "sent",
      spec_snapshot: {
        label_type: enquiry.label_type,
        width: enquiry.width,
        height: enquiry.height,
        measurement_unit: enquiry.measurement_unit,
        material: enquiry.material,
        fold_type: enquiry.fold_type,
        background_colour: enquiry.background_colour,
        text_colour: enquiry.text_colour,
      },
      unit_price,
      quantity,
      subtotal,
      delivery_fee,
      discount,
      total,
      valid_until,
      terms: terms || null,
      created_by: admin.id,
      sent_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !quotation) {
    console.error("[createQuotationAction] failed to create quotation:", error);
    return { error: "Could not create the quotation. Please try again." };
  }

  await supabase.from("enquiries").update({ status: "quotation_sent" }).eq("id", enquiryId);
  await recordStatusEvent({ entityType: "enquiry", entityId: enquiryId, fromStatus: enquiry.status as WorkflowStatus, toStatus: "quotation_sent", actorId: admin.id, note: "Quotation sent to customer." });
  await notifyUser({
    userId: enquiry.customer?.user_id ?? null,
    type: "quotation_sent",
    title: "Your quotation is ready",
    body: `Quotation for enquiry ${enquiry.enquiry_number} is ready for your review.`,
    entityType: "quotation",
    entityId: quotation.id,
  });

  revalidatePath(`/admin/enquiries/${enquiryId}`);
  revalidatePath(`/enquiries/${enquiryId}`);
  revalidatePath("/dashboard");
  redirect(`/admin/enquiries/${enquiryId}`);
}

// ---------------------------------------------------------------------
// Customer: accept / request changes / decline
// ---------------------------------------------------------------------
async function respondToQuotation(quotationId: string, outcome: "accepted" | "declined" | "changes_requested", note: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to respond to this quotation." };

  const { data: quotation } = await supabase.from("quotations").select("*, enquiry:enquiries(*)").eq("id", quotationId).single();
  if (!quotation) return { error: "Quotation not found." };

  const admin = createAdminClient();
  const newQuotationStatus = outcome === "accepted" ? "accepted" : "declined";
  await admin.from("quotations").update({ status: newQuotationStatus, customer_response_note: note || null, responded_at: new Date().toISOString() }).eq("id", quotationId);

  const enquiryStatus: WorkflowStatus = outcome === "accepted" ? "quotation_accepted" : outcome === "changes_requested" ? "changes_requested" : "quotation_declined";
  await admin.from("enquiries").update({ status: enquiryStatus }).eq("id", quotation.enquiry_id);
  await recordStatusEvent({ entityType: "enquiry", entityId: quotation.enquiry_id, fromStatus: quotation.enquiry.status, toStatus: enquiryStatus, actorId: user.id, note: note || undefined });

  await notifyAdmins({
    type: "quotation_response",
    title: outcome === "accepted" ? "Quotation accepted" : outcome === "changes_requested" ? "Customer requested changes" : "Quotation declined",
    body: `${quotation.enquiry.enquiry_number}: ${note || "No additional note."}`,
    entityType: "quotation",
    entityId: quotationId,
  });

  revalidatePath(`/quotations/${quotationId}`);
  revalidatePath(`/enquiries/${quotation.enquiry_id}`);
  revalidatePath(`/admin/enquiries/${quotation.enquiry_id}`);
  revalidatePath("/dashboard");
  return {};
}

export async function acceptQuotationAction(_prev: QuotationActionState, formData: FormData) {
  return respondToQuotation(String(formData.get("quotation_id")), "accepted", String(formData.get("note") || ""));
}

export async function requestQuotationChangesAction(_prev: QuotationActionState, formData: FormData) {
  const note = String(formData.get("note") || "").trim();
  if (!note) return { error: "Please describe the changes you'd like." };
  return respondToQuotation(String(formData.get("quotation_id")), "changes_requested", note);
}

export async function declineQuotationAction(_prev: QuotationActionState, formData: FormData) {
  return respondToQuotation(String(formData.get("quotation_id")), "declined", String(formData.get("note") || ""));
}
