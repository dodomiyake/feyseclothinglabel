"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import { notifyUser, recordStatusEvent } from "@/lib/actions/system";

export interface InvoiceActionState {
  error?: string;
}

export async function createInvoiceAction(_prev: InvoiceActionState, formData: FormData): Promise<InvoiceActionState> {
  const admin = await requireProfile("admin");
  const quotationId = String(formData.get("quotation_id") || "");
  const bankAccountId = String(formData.get("bank_account_id") || "") || null;
  const dueDate = String(formData.get("due_date") || "");
  const terms = String(formData.get("terms") || "").trim();

  if (!quotationId || !dueDate) return { error: "Please fill in all required fields." };

  const supabase = await createClient();
  const { data: quotation } = await supabase.from("quotations").select("*, enquiry:enquiries(*, customer:customers(*))").eq("id", quotationId).single();
  if (!quotation) return { error: "Quotation not found." };
  if (quotation.status !== "accepted") return { error: "Only accepted quotations can be invoiced." };

  const adminDb = createAdminClient();
  const { data: invoice, error } = await adminDb
    .from("invoices")
    .insert({
      enquiry_id: quotation.enquiry_id,
      quotation_id: quotationId,
      status: "awaiting_payment",
      subtotal: quotation.subtotal,
      delivery_fee: quotation.delivery_fee,
      discount: quotation.discount,
      total: quotation.total,
      currency: quotation.currency,
      bank_account_id: bankAccountId,
      due_date: dueDate,
      terms: terms || null,
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (error || !invoice) {
    console.error("[createInvoiceAction] failed to create invoice:", error);
    return { error: "Could not create the invoice. Please try again." };
  }

  await adminDb.from("enquiries").update({ status: "awaiting_payment" }).eq("id", quotation.enquiry_id);
  await recordStatusEvent({ entityType: "enquiry", entityId: quotation.enquiry_id, fromStatus: "quotation_accepted", toStatus: "awaiting_payment", actorId: admin.id, note: "Invoice issued." });
  await notifyUser({
    userId: quotation.enquiry.customer?.user_id ?? null,
    type: "invoice_issued",
    title: "Your invoice is ready",
    body: `Invoice for enquiry ${quotation.enquiry.enquiry_number} is ready. Please make your bank transfer and upload proof of payment.`,
    entityType: "invoice",
    entityId: invoice.id,
  });

  redirect(`/admin/enquiries/${quotation.enquiry_id}`);
}
