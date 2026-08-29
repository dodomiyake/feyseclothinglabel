"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import { paymentEvidenceSchema } from "@/lib/validation";
import { notifyAdmins, notifyUser, recordStatusEvent } from "@/lib/actions/system";

export interface PaymentActionState {
  error?: string;
}

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function submitPaymentEvidenceAction(_prev: PaymentActionState, formData: FormData): Promise<PaymentActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in to submit payment evidence." };

  const invoiceId = String(formData.get("invoice_id") || "");
  const raw = Object.fromEntries(formData.entries());
  const parsed = paymentEvidenceSchema.safeParse(raw);
  if (!parsed.success || !invoiceId) return { error: parsed.success ? "Invoice not found." : parsed.error.issues[0]?.message ?? "Please check the form." };

  const file = formData.get("evidence") as File | null;
  if (!file || file.size === 0) return { error: "Please attach your proof of payment." };
  if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_BYTES) return { error: "File must be a PNG, JPG or PDF under 10MB." };

  const { data: invoice } = await supabase.from("invoices").select("*, enquiry:enquiries(*)").eq("id", invoiceId).single();
  if (!invoice) return { error: "Invoice not found." };

  const admin = createAdminClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${invoiceId}/${randomUUID()}.${ext}`;
  const { error: uploadError } = await admin.storage.from("payment-evidence").upload(path, file, { contentType: file.type });
  if (uploadError) {
    console.error("[submitPaymentEvidenceAction] failed to upload evidence file:", uploadError);
    return { error: "Could not upload your file. Please try again." };
  }

  const { amount_paid, payment_date, sender_account_name, sender_bank } = parsed.data;
  await admin.from("payments").insert({
    invoice_id: invoiceId,
    amount_paid,
    payment_date,
    sender_account_name,
    sender_bank: sender_bank || null,
    evidence_file_path: path,
    status: "submitted",
    submitted_by: user.id,
  });

  await admin.from("invoices").update({ status: "payment_evidence_submitted" }).eq("id", invoiceId);
  await admin.from("enquiries").update({ status: "payment_under_review" }).eq("id", invoice.enquiry_id);
  await recordStatusEvent({
    entityType: "enquiry",
    entityId: invoice.enquiry_id,
    fromStatus: invoice.enquiry.status,
    toStatus: "payment_under_review",
    actorId: user.id,
    note: `Payment evidence submitted: ${sender_account_name}, ${amount_paid}`,
  });

  await notifyAdmins({
    type: "payment_evidence_submitted",
    title: "Payment evidence submitted",
    body: `${invoice.invoice_number}: ${sender_account_name} paid ${amount_paid}. Please review.`,
    entityType: "invoice",
    entityId: invoiceId,
  });

  revalidatePath(`/invoices/${invoiceId}`);
  redirect(`/invoices/${invoiceId}`);
}

// ---------------------------------------------------------------------
// Admin: approve / reject payment evidence
// ---------------------------------------------------------------------
export async function reviewPaymentAction(_prev: PaymentActionState, formData: FormData): Promise<PaymentActionState> {
  const admin = await requireProfile("admin");
  const paymentId = String(formData.get("payment_id") || "");
  const decision = String(formData.get("decision") || ""); // "confirm" | "reject"
  const reason = String(formData.get("reason") || "").trim();

  if (decision === "reject" && !reason) return { error: "Please provide a reason the customer can see." };

  const adminDb = createAdminClient();
  const { data: payment } = await adminDb.from("payments").select("*, invoice:invoices(*, enquiry:enquiries(*, customer:customers(*)))").eq("id", paymentId).single();
  if (!payment) return { error: "Payment record not found." };

  const invoice = payment.invoice;
  const enquiry = invoice.enquiry;

  if (decision === "confirm") {
    await adminDb.from("payments").update({ status: "confirmed", reviewed_by: admin.id, reviewed_at: new Date().toISOString() }).eq("id", paymentId);
    await adminDb.from("invoices").update({ status: "payment_confirmed" }).eq("id", invoice.id);
    await adminDb.from("enquiries").update({ status: "production_authorised" }).eq("id", enquiry.id);

    const { data: order } = await adminDb
      .from("orders")
      .insert({
        enquiry_id: enquiry.id,
        invoice_id: invoice.id,
        payment_id: paymentId,
        status: "production_authorised",
        production_deadline: enquiry.required_date,
        authorised_by: admin.id,
      })
      .select("id")
      .single();

    if (order) {
      await adminDb.from("production_jobs").insert({ order_id: order.id, stage: "not_started" });
      await recordStatusEvent({ entityType: "order", entityId: order.id, fromStatus: null, toStatus: "production_authorised", actorId: admin.id });
    }

    await recordStatusEvent({ entityType: "enquiry", entityId: enquiry.id, fromStatus: "payment_under_review", toStatus: "production_authorised", actorId: admin.id, note: "Payment verified." });
    await notifyUser({
      userId: enquiry.customer?.user_id ?? null,
      type: "payment_confirmed",
      title: "Payment confirmed",
      body: `We've verified your payment for ${invoice.invoice_number}. Production is starting.`,
      entityType: "order",
      entityId: order?.id,
    });
  } else {
    await adminDb.from("payments").update({ status: "rejected", rejection_reason: reason, reviewed_by: admin.id, reviewed_at: new Date().toISOString() }).eq("id", paymentId);
    await adminDb.from("invoices").update({ status: "payment_rejected" }).eq("id", invoice.id);
    await adminDb.from("enquiries").update({ status: "payment_rejected" }).eq("id", enquiry.id);
    await recordStatusEvent({ entityType: "enquiry", entityId: enquiry.id, fromStatus: "payment_under_review", toStatus: "payment_rejected", actorId: admin.id, note: reason });
    await notifyUser({
      userId: enquiry.customer?.user_id ?? null,
      type: "payment_rejected",
      title: "Payment evidence rejected",
      body: `We couldn't verify your payment for ${invoice.invoice_number}: ${reason}`,
      entityType: "invoice",
      entityId: invoice.id,
    });
  }

  revalidatePath("/admin/payments");
  revalidatePath(`/invoices/${invoice.id}`);
  revalidatePath(`/enquiries/${enquiry.id}`);
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  return {};
}
