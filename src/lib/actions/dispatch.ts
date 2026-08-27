"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProfile } from "@/lib/auth";
import { dispatchSchema } from "@/lib/validation";
import { notifyUser, recordStatusEvent } from "@/lib/actions/system";
import type { WorkflowStatus } from "@/lib/types";

export interface DispatchActionState {
  error?: string;
}

export async function upsertDispatchAction(_prev: DispatchActionState, formData: FormData): Promise<DispatchActionState> {
  const admin = await requireProfile("admin");
  const orderId = String(formData.get("order_id") || "");
  const raw = Object.fromEntries(formData.entries());
  const parsed = dispatchSchema.safeParse(raw);
  if (!orderId || !parsed.success) return { error: parsed.success ? "Order not found." : parsed.error.issues[0]?.message ?? "Please check the form." };

  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*, enquiry:enquiries(*, customer:customers(*))").eq("id", orderId).single();
  if (!order) return { error: "Order not found." };

  const adminDb = createAdminClient();
  const { rider_name, rider_phone, dispatch_company, collection_at, dispatch_fee, tracking_reference } = parsed.data;

  await adminDb.from("dispatches").upsert(
    {
      order_id: orderId,
      rider_name,
      rider_phone,
      dispatch_company: dispatch_company || null,
      collection_at,
      dispatch_fee,
      delivery_address: [order.enquiry.delivery_address, order.enquiry.delivery_city, order.enquiry.delivery_state].filter(Boolean).join(", "),
      tracking_reference: tracking_reference || null,
      status: "collected",
      created_by: admin.id,
    },
    { onConflict: "order_id" }
  );

  await adminDb.from("orders").update({ status: "out_for_delivery" }).eq("id", orderId);
  await adminDb.from("enquiries").update({ status: "out_for_delivery" }).eq("id", order.enquiry_id);
  await recordStatusEvent({ entityType: "order", entityId: orderId, fromStatus: order.status, toStatus: "out_for_delivery", actorId: admin.id, note: `Dispatched with ${rider_name}.` });

  await notifyUser({
    userId: order.enquiry.customer?.user_id ?? null,
    type: "order_dispatched",
    title: "Your order is on its way",
    body: `Order ${order.order_number} is out for delivery with ${rider_name} (${rider_phone}).`,
    entityType: "order",
    entityId: orderId,
  });

  revalidatePath(`/admin/dispatch/${orderId}`);
  revalidatePath("/admin/dispatch");
  return {};
}

export async function markDeliveredAction(formData: FormData) {
  const admin = await requireProfile("admin");
  const orderId = String(formData.get("order_id") || "");
  if (!orderId) return;

  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*, enquiry:enquiries(*, customer:customers(*))").eq("id", orderId).single();
  if (!order) return;

  const adminDb = createAdminClient();
  await adminDb.from("dispatches").update({ status: "delivered" }).eq("order_id", orderId);
  await adminDb.from("orders").update({ status: "delivered" }).eq("id", orderId);
  await adminDb.from("enquiries").update({ status: "delivered" }).eq("id", order.enquiry_id);
  await recordStatusEvent({ entityType: "order", entityId: orderId, fromStatus: "out_for_delivery", toStatus: "delivered", actorId: admin.id });

  await notifyUser({
    userId: order.enquiry.customer?.user_id ?? null,
    type: "order_delivered",
    title: "Order delivered",
    body: `Order ${order.order_number} has been marked as delivered. Thank you for choosing Feyse Clothing Labels!`,
    entityType: "order",
    entityId: orderId,
  });

  revalidatePath(`/admin/dispatch/${orderId}`);
  revalidatePath("/admin/dispatch");
}

export async function markDeliveryUnsuccessfulAction(formData: FormData) {
  const admin = await requireProfile("admin");
  const orderId = String(formData.get("order_id") || "");
  const note = String(formData.get("note") || "").trim();
  if (!orderId) return;

  const adminDb = createAdminClient();
  const { data: order } = await adminDb.from("orders").select("status, enquiry_id").eq("id", orderId).single();
  if (!order) return;

  await adminDb.from("dispatches").update({ status: "delivery_unsuccessful" }).eq("order_id", orderId);
  const status: WorkflowStatus = "delivery_unsuccessful";
  await adminDb.from("orders").update({ status }).eq("id", orderId);
  await adminDb.from("enquiries").update({ status }).eq("id", order.enquiry_id);
  await recordStatusEvent({ entityType: "order", entityId: orderId, fromStatus: order.status, toStatus: status, actorId: admin.id, note: note || undefined });

  revalidatePath(`/admin/dispatch/${orderId}`);
  revalidatePath("/admin/dispatch");
}

export async function uploadProofOfDeliveryAction(formData: FormData) {
  await requireProfile("admin");
  const orderId = String(formData.get("order_id") || "");
  const file = formData.get("proof") as File | null;
  if (!orderId || !file || file.size === 0) return;

  const adminDb = createAdminClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${orderId}/${randomUUID()}.${ext}`;
  const { error } = await adminDb.storage.from("dispatch-proof").upload(path, file, { contentType: file.type });
  if (!error) await adminDb.from("dispatches").update({ proof_of_delivery_path: path }).eq("order_id", orderId);

  revalidatePath(`/admin/dispatch/${orderId}`);
}
