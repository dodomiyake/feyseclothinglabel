"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { checkBotId } from "botid/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enquirySchema } from "@/lib/validation";
import { notifyAdmins, recordStatusEvent } from "@/lib/actions/system";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { enqueueCrmSync } from "@/lib/crm-sync";

export interface EnquiryActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

const MAX_FILES = 6;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml", "application/pdf"]);
const MAX_FILE_BYTES = 15 * 1024 * 1024;

export async function submitEnquiryAction(_prev: EnquiryActionState, formData: FormData): Promise<EnquiryActionState> {
  const verification = await checkBotId();
  if (verification.isBot) {
    return { error: "We couldn't process that submission. Please try again or contact us on WhatsApp." };
  }

  const admin = createAdminClient();

  const ip = await clientIp();
  const withinIpLimit = await checkRateLimit(admin, `enquiry:ip:${ip}`, { limit: 20, windowMs: 60 * 60 * 1000 });
  if (!withinIpLimit) {
    return { error: "Too many attempts from this connection. Please try again in a bit, or contact us on WhatsApp." };
  }

  const intent = String(formData.get("intent") || "submit"); // "draft" | "submit"
  const raw = Object.fromEntries(formData.entries());

  if (intent === "submit") {
    const parsed = enquirySchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
      return { error: "Please fix the highlighted fields.", fieldErrors };
    }
  } else if (!String(raw.whatsapp_number || "").trim() || !String(raw.full_name || "").trim()) {
    return { error: "Add at least your name and WhatsApp number before saving a draft." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const whatsapp = String(raw.whatsapp_number || "").trim();
  const email = String(raw.email || "").trim() || null;

  // Basic abuse guard: cap submissions per WhatsApp number per hour.
  if (whatsapp && intent === "submit") {
    const { data: matchingCustomers } = await admin.from("customers").select("id").eq("whatsapp_number", whatsapp);
    const ids = (matchingCustomers ?? []).map((c) => c.id);
    if (ids.length) {
      const { count } = await admin
        .from("enquiries")
        .select("id", { count: "exact", head: true })
        .in("customer_id", ids)
        .eq("status", "submitted")
        .gte("submitted_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
      if ((count ?? 0) >= 5) {
        return { error: "You've submitted several enquiries recently. Please contact us on WhatsApp to continue." };
      }
    }
  }

  // Find or create the customer record.
  let customerId: string;
  if (user) {
    const { data: existing } = await admin.from("customers").select("id").eq("user_id", user.id).maybeSingle();
    if (existing) {
      customerId = existing.id;
      await admin
        .from("customers")
        .update({
          full_name: String(raw.full_name || "").trim() || undefined,
          business_name: String(raw.business_name || "").trim() || undefined,
          whatsapp_number: whatsapp || undefined,
          delivery_phone: String(raw.delivery_phone || "").trim() || undefined,
          email: email || undefined,
        })
        .eq("id", customerId);
    } else {
      const { data: created, error } = await admin
        .from("customers")
        .insert({
          user_id: user.id,
          full_name: String(raw.full_name || "").trim() || "Customer",
          business_name: String(raw.business_name || "").trim() || null,
          whatsapp_number: whatsapp,
          delivery_phone: String(raw.delivery_phone || "").trim() || null,
          email,
          source: "website",
        })
        .select("id")
        .single();
      if (error || !created) {
        console.error("[submitEnquiryAction] failed to create customer (signed in):", error);
        return { error: "Something went wrong. Please try again." };
      }
      customerId = created.id;
    }
  } else {
    const { data: existing } = await admin
      .from("customers")
      .select("id")
      .is("user_id", null)
      .eq("whatsapp_number", whatsapp)
      .maybeSingle();
    if (existing) {
      customerId = existing.id;
    } else {
      const { data: created, error } = await admin
        .from("customers")
        .insert({
          full_name: String(raw.full_name || "").trim() || "Customer",
          business_name: String(raw.business_name || "").trim() || null,
          whatsapp_number: whatsapp,
          delivery_phone: String(raw.delivery_phone || "").trim() || null,
          email,
          source: "website",
        })
        .select("id")
        .single();
      if (error || !created) {
        console.error("[submitEnquiryAction] failed to create customer (anonymous):", error);
        return { error: "Something went wrong. Please try again." };
      }
      customerId = created.id;
    }
  }

  const now = new Date().toISOString();
  const enquiryPayload = {
    customer_id: customerId,
    status: intent === "submit" ? "submitted" : "draft",
    label_type: raw.label_type || null,
    material: raw.material || null,
    width: raw.width ? Number(raw.width) : null,
    height: raw.height ? Number(raw.height) : null,
    measurement_unit: raw.measurement_unit || "cm",
    quantity: raw.quantity ? Number(raw.quantity) : null,
    background_colour: raw.background_colour || null,
    text_colour: raw.text_colour || null,
    fold_type: raw.fold_type || null,
    needs_help_choosing: raw.needs_help_choosing === "on" || raw.needs_help_choosing === "true",
    additional_instructions: raw.additional_instructions || null,
    delivery_address: raw.delivery_address || null,
    delivery_city: raw.delivery_city || null,
    delivery_state: raw.delivery_state || null,
    delivery_phone: raw.delivery_phone || null,
    required_date: raw.required_date || null,
    created_by: user?.id ?? null,
    submitted_at: intent === "submit" ? now : null,
  };

  const draftId = String(raw.draft_id || "");
  let enquiryId: string;
  let enquiryNumber: string;
  let wasChangesRequested = false;

  if (draftId) {
    const { data: existing } = await admin.from("enquiries").select("status").eq("id", draftId).maybeSingle();
    wasChangesRequested = existing?.status === "changes_requested";

    const { data: updated, error } = await admin
      .from("enquiries")
      .update(enquiryPayload)
      .eq("id", draftId)
      .select("id, enquiry_number")
      .single();
    if (error || !updated) {
      console.error("[submitEnquiryAction] failed to update draft enquiry:", error);
      return { error: "Something went wrong. Please try again." };
    }
    enquiryId = updated.id;
    enquiryNumber = updated.enquiry_number;
  } else {
    const { data: created, error } = await admin.from("enquiries").insert(enquiryPayload).select("id, enquiry_number").single();
    if (error || !created) {
      console.error("[submitEnquiryAction] failed to create enquiry:", error);
      return { error: "Something went wrong. Please try again." };
    }
    enquiryId = created.id;
    enquiryNumber = created.enquiry_number;
  }

  // Handle file uploads (logo + reference images).
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0).slice(0, MAX_FILES);
  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_BYTES) continue;
    const ext = file.name.split(".").pop() || "bin";
    const path = `${enquiryId}/${randomUUID()}.${ext}`;
    const { error: uploadError } = await admin.storage.from("artwork").upload(path, file, { contentType: file.type });
    if (!uploadError) {
      await admin.from("enquiry_files").insert({
        enquiry_id: enquiryId,
        file_path: path,
        file_kind: "reference",
        original_name: file.name,
        uploaded_by: user?.id ?? null,
      });
    }
  }

  await admin.from("enquiry_revisions").insert({
    enquiry_id: enquiryId,
    spec_snapshot: enquiryPayload,
    note: intent === "submit" ? "Enquiry submitted by customer" : "Draft saved by customer",
    changed_by: user?.id ?? null,
  });

  let portalToken: string | null = null;
  if (!user) {
    const { data: link } = await admin
      .from("secure_links")
      .insert({ customer_id: customerId, enquiry_id: enquiryId, created_by: null })
      .select("token")
      .single();
    portalToken = link?.token ?? null;
  }

  if (intent === "submit") {
    if (wasChangesRequested) {
      await recordStatusEvent({
        entityType: "enquiry",
        entityId: enquiryId,
        fromStatus: "changes_requested",
        toStatus: "submitted",
        actorId: user?.id ?? null,
        note: "Customer updated and resubmitted the enquiry.",
      });
    }
    await notifyAdmins({
      type: wasChangesRequested ? "enquiry_resubmitted" : "new_enquiry",
      title: wasChangesRequested ? "Customer resubmitted enquiry" : "New enquiry received",
      body: wasChangesRequested
        ? `${String(raw.full_name || "A customer")} updated enquiry ${enquiryNumber} after requested changes — please review.`
        : `${String(raw.full_name || "A customer")} submitted enquiry ${enquiryNumber}.`,
      entityType: "enquiry",
      entityId: enquiryId,
    });
    // A resubmission already queued a stage update through recordStatusEvent.
    if (!wasChangesRequested) {
      await enqueueCrmSync({
        eventType: "enquiry_upsert",
        customerId,
        enquiryId,
      });
    }
    redirect(`/enquiry/confirmation/${enquiryId}${portalToken ? `?t=${portalToken}` : ""}`);
  }

  redirect(`/enquiry?draft=${enquiryId}${portalToken ? `&t=${portalToken}` : ""}`);
}
