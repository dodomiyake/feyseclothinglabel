import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSignedFileUrl } from "@/lib/files";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/domain/whatsapp-button";
import { EnquiryStatusControls } from "@/components/domain/enquiry-status-controls";
import { WhatsappNotesPanel } from "@/components/domain/whatsapp-notes-panel";
import { UploadedFilesCard } from "@/components/domain/uploaded-files-card";
import { LABEL_TYPE_META, FOLD_TYPE_META } from "@/lib/workflow";
import { formatDate, formatDateTime } from "@/lib/currency";
import { businessWhatsAppLink, enquiryWhatsAppMessage } from "@/lib/whatsapp";
import type { FoldType, LabelType, WorkflowStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Enquiry workspace — Feyse Clothing Labels" };

// Once a quotation is accepted, the enquiry is a real order in progress —
// cancelling, holding, or requesting changes through this generic panel
// would leave the invoice/payment/production trail dangling. From that
// point on, the quotation/invoice/payment/production panels are the
// controls for moving things forward.
const COMMITTED_STATUSES: WorkflowStatus[] = [
  "quotation_accepted",
  "invoice_issued",
  "awaiting_payment",
  "payment_evidence_submitted",
  "payment_under_review",
  "payment_confirmed",
  "payment_rejected",
  "production_authorised",
  "in_production",
  "quality_check",
  "ready_for_dispatch",
  "out_for_delivery",
  "delivered",
  "delivery_unsuccessful",
  "completed",
  "cancelled",
  "refund_pending",
  "refunded",
];

export default async function AdminEnquiryWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: enquiry } = await supabase.from("enquiries").select("*, customer:customers(*)").eq("id", id).maybeSingle();
  if (!enquiry) notFound();

  const [{ data: files }, { data: notes }, { data: quotations }, { data: order }] = await Promise.all([
    supabase.from("enquiry_files").select("*").eq("enquiry_id", id),
    supabase.from("whatsapp_notes").select("*").eq("enquiry_id", id).order("created_at", { ascending: false }),
    supabase.from("quotations").select("*").eq("enquiry_id", id).order("created_at", { ascending: false }),
    supabase.from("orders").select("id, order_number").eq("enquiry_id", id).maybeSingle(),
  ]);

  const fileEntries = await Promise.all(
    (files ?? []).map(async (f) => ({
      id: f.id,
      name: f.original_name || f.file_path.split("/").pop() || "file",
      kind: f.file_kind,
      url: await getSignedFileUrl("artwork", f.file_path),
    }))
  );

  const latestQuotation = quotations?.[0];
  const specRows: [string, string | null][] = [
    ["Label type", enquiry.label_type ? LABEL_TYPE_META[enquiry.label_type as LabelType].label : "Not specified — help choosing"],
    ["Material", enquiry.material],
    ["Dimensions", enquiry.width && enquiry.height ? `${enquiry.width} x ${enquiry.height} ${enquiry.measurement_unit}` : null],
    ["Quantity", enquiry.quantity?.toString() ?? "Not specified"],
    ["Background colour", enquiry.background_colour],
    ["Text / logo colour", enquiry.text_colour],
    ["Fold / finishing", enquiry.fold_type ? FOLD_TYPE_META[enquiry.fold_type as FoldType] : null],
    ["Delivery address", [enquiry.delivery_address, enquiry.delivery_city, enquiry.delivery_state].filter(Boolean).join(", ") || null],
    ["Required by", enquiry.required_date ? formatDate(enquiry.required_date) : null],
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">Enquiry workspace</p>
          <h1 className="mt-1 font-serif text-3xl text-ink-950">{enquiry.enquiry_number}</h1>
          <p className="mt-1 text-sm text-neutral-600">{enquiry.customer?.business_name || enquiry.customer?.full_name}</p>
        </div>
        <StatusBadge status={enquiry.status} className="text-sm" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Specification</CardTitle></CardHeader>
            <CardBody>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {specRows.filter(([, v]) => v).map(([label, value]) => (
                  <div key={label}><dt className="text-xs text-neutral-500">{label}</dt><dd className="text-sm text-ink-900">{value}</dd></div>
                ))}
              </dl>
              {enquiry.additional_instructions && (
                <div className="mt-4 border-t border-ink-900/8 pt-4">
                  <dt className="text-xs text-neutral-500">Additional instructions</dt>
                  <dd className="mt-1 text-sm text-ink-900">{enquiry.additional_instructions}</dd>
                </div>
              )}
              {enquiry.needs_help_choosing && (
                <p className="mt-4 rounded-lg bg-gold-400/15 px-3 py-2 text-xs text-gold-700">Customer requested help choosing a label type.</p>
              )}
            </CardBody>
          </Card>

          <UploadedFilesCard title="Artwork & reference files" files={fileEntries} />

          <WhatsappNotesPanel enquiryId={id} notes={notes ?? []} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardBody className="space-y-1.5 text-sm">
              <p className="text-ink-900">{enquiry.customer?.full_name}</p>
              {enquiry.customer?.business_name && <p className="text-neutral-600">{enquiry.customer.business_name}</p>}
              <p className="text-neutral-600">{enquiry.customer?.email}</p>
              <p className="text-neutral-600">{enquiry.customer?.whatsapp_number}</p>
              <WhatsAppButton
                href={businessWhatsAppLink(enquiry.customer?.whatsapp_number ?? "", enquiryWhatsAppMessage(enquiry.enquiry_number))}
                className="mt-2 w-full"
                variant="outline"
              />
            </CardBody>
          </Card>

          {!COMMITTED_STATUSES.includes(enquiry.status) && (
            <Card>
              <CardHeader><CardTitle>Move this enquiry forward</CardTitle></CardHeader>
              <CardBody className="space-y-3">
                <EnquiryStatusControls enquiryId={id} currentStatus={enquiry.status} />
                {!latestQuotation && (
                  <Button href={`/admin/enquiries/${id}/quotation`} className="w-full">Create quotation</Button>
                )}
              </CardBody>
            </Card>
          )}

          {!!quotations?.length && (
            <Card>
              <CardHeader><CardTitle>Quotations</CardTitle></CardHeader>
              <CardBody className="space-y-2">
                {quotations.map((q) => (
                  <div key={q.id} className="flex items-center justify-between rounded-lg bg-cream-200/50 px-3 py-2 text-sm">
                    <div>
                      <p className="text-ink-900">{q.quotation_number}</p>
                      <p className="text-xs text-neutral-500">{formatDateTime(q.created_at)}</p>
                    </div>
                    <StatusBadge status={q.status === "accepted" ? "quotation_accepted" : q.status === "declined" ? "quotation_declined" : "quotation_sent"} />
                  </div>
                ))}
                {latestQuotation?.status === "accepted" && (
                  <Button href={`/admin/quotations/${latestQuotation.id}/invoice`} className="w-full" variant="gold">
                    Create invoice
                  </Button>
                )}
              </CardBody>
            </Card>
          )}

          {order && (
            <Card className="border-sage-500/40 bg-sage-500/5">
              <CardBody className="py-4">
                <p className="text-sm text-ink-900">Order {order.order_number} is active.</p>
                <Button href={`/admin/production/${order.id}`} size="sm" variant="outline" className="mt-2">View production job</Button>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
