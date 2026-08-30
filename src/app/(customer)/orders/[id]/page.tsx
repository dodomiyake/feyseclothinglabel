import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/domain/status-badge";
import { OrderTimeline } from "@/components/domain/order-timeline";
import { OrderRealtimeRefresh } from "@/components/domain/order-realtime-refresh";
import { Button } from "@/components/ui/button";
import { confirmDeliveryAction } from "@/lib/actions/orders";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/currency";
import { describeSpec } from "@/lib/spec";
import { isTerminalStatus, STATUS_META } from "@/lib/workflow";
import type { WorkflowStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Order tracking — Feyse Clothing Labels" };

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireProfile("customer");
  const supabase = await createClient();

  const { data: order } = await supabase.from("orders").select("*, enquiry:enquiries(*), invoice:invoices(*)").eq("id", id).maybeSingle();
  if (!order) notFound();

  const { data: productionJob } = await supabase.from("production_jobs").select("*").eq("order_id", id).maybeSingle();
  const { data: dispatch } = await supabase.from("dispatches").select("*").eq("order_id", id).maybeSingle();
  const { data: photos } = productionJob
    ? await supabase.from("production_photos").select("*").eq("production_job_id", productionJob.id).order("created_at", { ascending: false })
    : { data: null };

  const spec = describeSpec(order.enquiry);
  const showConfirmDelivery = dispatch?.status === "delivered" && !dispatch.customer_confirmed_at;
  const isOffTrack = ["on_hold", "cancelled", "refund_pending", "refunded", "delivery_unsuccessful"].includes(order.status);

  return (
    <div className="max-w-3xl space-y-6">
      <OrderRealtimeRefresh orderId={id} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.3em] text-gold-700 uppercase">Order</p>
          <h1 className="mt-1 font-serif text-3xl text-ink-950">{order.order_number}</h1>
          <p className="mt-1 text-sm text-neutral-600">{spec}</p>
        </div>
        <StatusBadge status={order.status} className="text-sm" />
      </div>

      {isOffTrack && (
        <Card className="border-terracotta-400/40 bg-terracotta-400/5">
          <CardBody className="py-4">
            <p className="text-sm font-medium text-ink-900">{STATUS_META[order.status as WorkflowStatus].label}</p>
            <p className="mt-1 text-sm text-neutral-600">{STATUS_META[order.status as WorkflowStatus].description} Please contact us on WhatsApp for details.</p>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
          <CardBody><OrderTimeline status={order.status} /></CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Order summary</CardTitle></CardHeader>
            <CardBody className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-neutral-600">Quantity</dt><dd>{order.enquiry.quantity}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-600">Total paid</dt><dd>{formatCurrency(order.invoice.total, order.invoice.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-600">Production deadline</dt><dd>{formatDate(order.production_deadline)}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-600">Delivery to</dt><dd className="text-right">{order.enquiry.delivery_city}, {order.enquiry.delivery_state}</dd></div>
            </CardBody>
          </Card>

          {dispatch && (
            <Card>
              <CardHeader><CardTitle>Dispatch</CardTitle></CardHeader>
              <CardBody className="space-y-2 text-sm">
                {dispatch.rider_name && <div className="flex justify-between"><dt className="text-neutral-600">Rider</dt><dd>{dispatch.rider_name}</dd></div>}
                {dispatch.rider_phone && <div className="flex justify-between"><dt className="text-neutral-600">Rider phone</dt><dd>{dispatch.rider_phone}</dd></div>}
                {dispatch.dispatch_company && <div className="flex justify-between"><dt className="text-neutral-600">Courier</dt><dd>{dispatch.dispatch_company}</dd></div>}
                {dispatch.tracking_reference && <div className="flex justify-between"><dt className="text-neutral-600">Tracking ref</dt><dd>{dispatch.tracking_reference}</dd></div>}
                {dispatch.collection_at && <div className="flex justify-between"><dt className="text-neutral-600">Collected</dt><dd>{formatDateTime(dispatch.collection_at)}</dd></div>}
                {showConfirmDelivery && (
                  <form action={confirmDeliveryAction} className="pt-2">
                    <input type="hidden" name="order_id" value={order.id} />
                    <Button type="submit" size="sm" variant="gold" className="w-full">Confirm I&apos;ve received my order</Button>
                  </form>
                )}
                {dispatch.customer_confirmed_at && <p className="pt-1 text-xs text-sage-600">You confirmed delivery on {formatDate(dispatch.customer_confirmed_at)}.</p>}
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {!!photos?.length && (
        <Card>
          <CardHeader><CardTitle>Production photos</CardTitle></CardHeader>
          <CardBody>
            <p className="text-sm text-neutral-600">{photos.length} photo(s) shared by our production team. Ask on WhatsApp to have them resent if needed.</p>
          </CardBody>
        </Card>
      )}

      {isTerminalStatus(order.status) && (
        <div className="flex flex-wrap gap-3">
          <Button href="/orders" variant="outline">Back to order history</Button>
        </div>
      )}
    </div>
  );
}
