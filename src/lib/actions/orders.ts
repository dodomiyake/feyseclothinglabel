"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdmins, recordStatusEvent } from "@/lib/actions/system";

export async function confirmDeliveryAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const orderId = String(formData.get("order_id") || "");
  const { data: order } = await supabase.from("orders").select("*, enquiry:enquiries(*)").eq("id", orderId).maybeSingle();
  if (!order) return;

  const admin = createAdminClient();
  await admin.from("dispatches").update({ customer_confirmed_at: new Date().toISOString() }).eq("order_id", orderId);
  await admin.from("orders").update({ status: "completed" }).eq("id", orderId);
  await admin.from("enquiries").update({ status: "completed" }).eq("id", order.enquiry_id);
  await recordStatusEvent({ entityType: "order", entityId: orderId, fromStatus: order.status, toStatus: "completed", actorId: user.id, note: "Customer confirmed delivery." });
  await notifyAdmins({ type: "order_completed", title: "Customer confirmed delivery", body: `${order.order_number} confirmed as delivered by the customer.`, entityType: "order", entityId: orderId });

  revalidatePath(`/orders/${orderId}`);
}

export async function reorderAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const sourceEnquiryId = String(formData.get("enquiry_id") || "");
  const { data: source } = await supabase.from("enquiries").select("*").eq("id", sourceEnquiryId).maybeSingle();
  if (!source) redirect("/orders");

  const admin = createAdminClient();
  const { data: created } = await admin
    .from("enquiries")
    .insert({
      customer_id: source.customer_id,
      status: "draft",
      label_type: source.label_type,
      material: source.material,
      width: source.width,
      height: source.height,
      measurement_unit: source.measurement_unit,
      quantity: source.quantity,
      background_colour: source.background_colour,
      text_colour: source.text_colour,
      fold_type: source.fold_type,
      additional_instructions: source.additional_instructions,
      delivery_address: source.delivery_address,
      delivery_city: source.delivery_city,
      delivery_state: source.delivery_state,
      delivery_phone: source.delivery_phone,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (!created) redirect("/orders");
  redirect(`/enquiry?draft=${created.id}`);
}
