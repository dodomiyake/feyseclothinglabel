"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SettingsActionState {
  error?: string;
  success?: boolean;
}

export async function updateBusinessSettingsAction(_prev: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  await requireProfile("admin");
  const raw = Object.fromEntries(formData.entries());

  const adminDb = createAdminClient();
  const { error } = await adminDb
    .from("business_settings")
    .update({
      business_name: String(raw.business_name || "").trim(),
      tagline: String(raw.tagline || "").trim(),
      registered_address: String(raw.registered_address || "").trim(),
      production_address: String(raw.production_address || "").trim(),
      support_whatsapp_number: String(raw.support_whatsapp_number || "").trim(),
      support_email: String(raw.support_email || "").trim(),
      default_quotation_validity_days: Number(raw.default_quotation_validity_days) || 7,
      default_invoice_due_days: Number(raw.default_invoice_due_days) || 3,
      invoice_terms: String(raw.invoice_terms || "").trim(),
      quotation_terms: String(raw.quotation_terms || "").trim(),
    })
    .eq("id", true);

  if (error) return { error: "Could not save settings. Please try again." };
  revalidatePath("/admin/settings/business");
  return { success: true };
}

export async function upsertBankAccountAction(formData: FormData) {
  await requireProfile("admin");
  const id = String(formData.get("id") || "");
  const adminDb = createAdminClient();
  const payload = {
    bank_name: String(formData.get("bank_name") || "").trim(),
    account_name: String(formData.get("account_name") || "").trim(),
    account_number: String(formData.get("account_number") || "").trim(),
    is_default: formData.get("is_default") === "on",
  };
  if (!payload.bank_name || !payload.account_name || !payload.account_number) return;

  if (payload.is_default) await adminDb.from("bank_accounts").update({ is_default: false }).neq("id", id || "00000000-0000-0000-0000-000000000000");

  if (id) {
    await adminDb.from("bank_accounts").update(payload).eq("id", id);
  } else {
    await adminDb.from("bank_accounts").insert(payload);
  }
  revalidatePath("/admin/settings/business");
}

export async function toggleBankAccountActiveAction(formData: FormData) {
  await requireProfile("admin");
  const id = String(formData.get("id") || "");
  const active = formData.get("active") === "true";
  const adminDb = createAdminClient();
  await adminDb.from("bank_accounts").update({ active: !active }).eq("id", id);
  revalidatePath("/admin/settings/business");
}

export async function upsertProductAction(formData: FormData) {
  await requireProfile("admin");
  const id = String(formData.get("id") || "");
  const adminDb = createAdminClient();
  const payload = {
    label_type: String(formData.get("label_type") || ""),
    name: String(formData.get("name") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    base_unit_price: Number(formData.get("base_unit_price")) || 0,
    min_quantity: Number(formData.get("min_quantity")) || 100,
  };
  if (!payload.name || !payload.label_type) return;

  if (id) {
    await adminDb.from("products").update(payload).eq("id", id);
  } else {
    await adminDb.from("products").insert(payload);
  }
  revalidatePath("/admin/settings/products");
}

export async function toggleProductActiveAction(formData: FormData) {
  await requireProfile("admin");
  const id = String(formData.get("id") || "");
  const active = formData.get("active") === "true";
  const adminDb = createAdminClient();
  await adminDb.from("products").update({ active: !active }).eq("id", id);
  revalidatePath("/admin/settings/products");
}
