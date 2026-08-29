import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSignedFileUrl } from "@/lib/files";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { StatusBadge } from "@/components/domain/status-badge";
import { DispatchForm } from "@/components/domain/dispatch-form";
import { Button } from "@/components/ui/button";
import { markDeliveredAction, markDeliveryUnsuccessfulAction, uploadProofOfDeliveryAction } from "@/lib/actions/dispatch";
import { Input } from "@/components/ui/form-fields";
import { formatDate, formatDateTime } from "@/lib/currency";
import { describeSpec } from "@/lib/spec";

export const metadata: Metadata = { title: "Dispatch order — Feyse Clothing Labels" };

export default async function AdminDispatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase.from("orders").select("*, enquiry:enquiries(*, customer:customers(*))").eq("id", id).maybeSingle();
  if (!order) notFound();

  const { data: dispatch } = await supabase.from("dispatches").select("*").eq("order_id", id).maybeSingle();
  const proofUrl = await getSignedFileUrl("dispatch-proof", dispatch?.proof_of_delivery_path);
  const isFinal = order.status === "completed";

  return (
    <div className="max-w-2xl space-y-6">
      <Breadcrumb items={[{ label: "Dispatch", href: "/admin/dispatch" }, { label: order.order_number }]} />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">Dispatch</p>
          <h1 className="mt-1 font-serif text-3xl text-ink-950">{order.order_number}</h1>
          <p className="mt-1 text-sm text-neutral-600">{order.enquiry.customer?.business_name || order.enquiry.customer?.full_name} — {describeSpec(order.enquiry)}</p>
        </div>
        <StatusBadge status={order.status} className="text-sm" />
      </div>

      <Card>
        <CardHeader><CardTitle>Delivery address</CardTitle></CardHeader>
        <CardBody className="text-sm text-ink-800">
          {[order.enquiry.delivery_address, order.enquiry.delivery_city, order.enquiry.delivery_state].filter(Boolean).join(", ")}
          <p className="mt-1 text-neutral-500">Phone: {order.enquiry.delivery_phone}</p>
          <p className="mt-1 text-neutral-500">Deadline: {formatDate(order.production_deadline)}</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Rider &amp; dispatch details</CardTitle></CardHeader>
        <CardBody>
          {isFinal && dispatch ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-neutral-500">Rider</dt><dd className="text-ink-900">{dispatch.rider_name}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-500">Rider phone</dt><dd className="text-ink-900">{dispatch.rider_phone}</dd></div>
              {dispatch.dispatch_company && <div className="flex justify-between"><dt className="text-neutral-500">Courier</dt><dd className="text-ink-900">{dispatch.dispatch_company}</dd></div>}
              {dispatch.tracking_reference && <div className="flex justify-between"><dt className="text-neutral-500">Tracking ref</dt><dd className="text-ink-900">{dispatch.tracking_reference}</dd></div>}
              {dispatch.collection_at && <div className="flex justify-between"><dt className="text-neutral-500">Collected</dt><dd className="text-ink-900">{formatDateTime(dispatch.collection_at)}</dd></div>}
            </dl>
          ) : (
            <DispatchForm orderId={order.id} dispatch={dispatch ?? null} />
          )}
        </CardBody>
      </Card>

      {dispatch && (
        <Card>
          <CardHeader><CardTitle>Delivery outcome</CardTitle></CardHeader>
          <CardBody className="space-y-4">
            <p className="text-sm text-neutral-600">Status: <span className="font-medium text-ink-900 capitalize">{dispatch.status.replace(/_/g, " ")}</span></p>
            {dispatch.collection_at && <p className="text-xs text-neutral-500">Collected {formatDateTime(dispatch.collection_at)}</p>}

            {!isFinal && (
              <form action={uploadProofOfDeliveryAction} encType="multipart/form-data" className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <input type="hidden" name="order_id" value={order.id} />
                <Input type="file" name="proof" accept="image/png,image/jpeg,image/webp" className="sm:flex-1" />
                <Button type="submit" size="sm" variant="outline">Upload proof of delivery</Button>
              </form>
            )}
            {proofUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={proofUrl} alt="Proof of delivery" className="max-h-64 rounded-lg object-cover" />
            )}

            {dispatch.status === "collected" || dispatch.status === "out_for_delivery" ? (
              <div className="flex flex-wrap gap-2 border-t border-ink-900/8 pt-3">
                <form action={markDeliveredAction}>
                  <input type="hidden" name="order_id" value={order.id} />
                  <Button type="submit" size="sm" variant="gold">Mark delivered</Button>
                </form>
                <form action={markDeliveryUnsuccessfulAction}>
                  <input type="hidden" name="order_id" value={order.id} />
                  <input type="hidden" name="note" value="Delivery attempt unsuccessful" />
                  <Button type="submit" size="sm" variant="danger">Delivery unsuccessful</Button>
                </form>
              </div>
            ) : null}

            {dispatch.customer_confirmed_at && (
              <p className="text-xs text-sage-600">Customer confirmed receipt on {formatDate(dispatch.customer_confirmed_at)}.</p>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
