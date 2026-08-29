"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";

export interface CustomerActionState {
  error?: string;
}

export async function createCustomerAction(_prev: CustomerActionState, formData: FormData): Promise<CustomerActionState> {
  const admin = await requireProfile("admin");
  const fullName = String(formData.get("full_name") || "").trim();
  const whatsapp = String(formData.get("whatsapp_number") || "").trim();
  if (!fullName || !whatsapp) return { error: "Name and WhatsApp number are required." };

  const adminDb = createAdminClient();
  const { data: customer, error } = await adminDb
    .from("customers")
    .insert({
      full_name: fullName,
      business_name: String(formData.get("business_name") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
      whatsapp_number: whatsapp,
      delivery_phone: String(formData.get("delivery_phone") || "").trim() || whatsapp,
      source: "whatsapp",
      notes: String(formData.get("notes") || "").trim() || null,
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (error || !customer) {
    console.error("[createCustomerAction] failed to create customer:", error);
    return { error: "Could not create this customer. They may already exist." };
  }
  redirect(`/admin/customers/${customer.id}`);
}

export async function updateCustomerNotesAction(formData: FormData) {
  await requireProfile("admin");
  const customerId = String(formData.get("customer_id") || "");
  const notes = String(formData.get("notes") || "");
  if (!customerId) return;

  const adminDb = createAdminClient();
  await adminDb.from("customers").update({ notes }).eq("id", customerId);
  revalidatePath(`/admin/customers/${customerId}`);
}

/**
 * Deactivating blocks sign-in for registered accounts (via the Auth admin
 * API, so it takes effect immediately, not just on next token refresh) and
 * flags the record so admin screens can surface it. Guest/WhatsApp-only
 * customers have no account to block — only the flag applies to them.
 */
export async function toggleCustomerActiveAction(formData: FormData) {
  await requireProfile("admin");
  const customerId = String(formData.get("customer_id") || "");
  const currentlyActive = formData.get("active") === "true";
  if (!customerId) return;

  const adminDb = createAdminClient();
  const { data: customer } = await adminDb.from("customers").select("user_id").eq("id", customerId).single();
  if (!customer) return;

  const { error } = await adminDb.from("customers").update({ is_active: !currentlyActive }).eq("id", customerId);
  if (error) {
    console.error("[toggleCustomerActiveAction] failed to update customer:", error);
    return;
  }

  if (customer.user_id) {
    const { error: authError } = await adminDb.auth.admin.updateUserById(customer.user_id, {
      ban_duration: currentlyActive ? "876000h" : "none",
    });
    if (authError) console.error("[toggleCustomerActiveAction] failed to update auth ban status:", authError);
  }

  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/customers");
}
