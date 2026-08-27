import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/domain/status-badge";
import { WhatsAppButton } from "@/components/domain/whatsapp-button";
import { Button } from "@/components/ui/button";
import { LABEL_TYPE_META, FOLD_TYPE_META } from "@/lib/workflow";
import { formatDate, formatDateTime } from "@/lib/currency";
import { businessWhatsAppLink, enquiryWhatsAppMessage } from "@/lib/whatsapp";
import type { FoldType, LabelType, StatusEvent } from "@/lib/types";

export const metadata: Metadata = { title: "Enquiry details — Feyse Clothing Labels" };

export default async function EnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireProfile("customer");
  const supabase = await createClient();

  const { data: enquiry } = await supabase.from("enquiries").select("*").eq("id", id).maybeSingle();
  if (!enquiry) notFound();

  const [{ data: files }, { data: events }, { data: quotation }] = await Promise.all([
    supabase.from("enquiry_files").select("*").eq("enquiry_id", id),
    supabase.from("status_events").select("*").eq("entity_type", "enquiry").eq("entity_id", id).order("created_at", { ascending: false }),
    supabase.from("quotations").select("id, status").eq("enquiry_id", id).neq("status", "draft").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const specRows: [string, string | null][] = [
    ["Label type", enquiry.label_type ? LABEL_TYPE_META[enquiry.label_type as LabelType].label : "To be discussed"],
    ["Material", enquiry.material],
    ["Dimensions", enquiry.width && enquiry.height ? `${enquiry.width} x ${enquiry.height} ${enquiry.measurement_unit}` : null],
    ["Quantity", enquiry.quantity?.toString() ?? "To be discussed"],
    ["Background colour", enquiry.background_colour],
    ["Text / logo colour", enquiry.text_colour],
    ["Fold / finishing", enquiry.fold_type ? FOLD_TYPE_META[enquiry.fold_type as FoldType] : null],
    ["Delivery address", [enquiry.delivery_address, enquiry.delivery_city, enquiry.delivery_state].filter(Boolean).join(", ")],
    ["Required by", enquiry.required_date ? formatDate(enquiry.required_date) : null],
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">Enquiry</p>
          <h1 className="mt-1 font-serif text-3xl text-ink-950">{enquiry.enquiry_number}</h1>
        </div>
        <StatusBadge status={enquiry.status} className="text-sm" />
      </div>

      {quotation && (
        <Card className="border-gold-500/40 bg-gold-400/10">
          <CardBody className="flex items-center justify-between py-4">
            <p className="text-sm text-ink-900">A quotation has been prepared for this enquiry.</p>
            <Button href={`/quotations/${quotation.id}`} size="sm" variant="gold">View quotation</Button>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Specification</CardTitle></CardHeader>
        <CardBody>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {specRows.filter(([, v]) => v).map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-neutral-500">{label}</dt>
                <dd className="text-sm text-ink-900">{value}</dd>
              </div>
            ))}
          </dl>
          {enquiry.additional_instructions && (
            <div className="mt-4 border-t border-ink-900/8 pt-4">
              <dt className="text-xs text-neutral-500">Additional instructions</dt>
              <dd className="mt-1 text-sm text-ink-900">{enquiry.additional_instructions}</dd>
            </div>
          )}
        </CardBody>
      </Card>

      {!!files?.length && (
        <Card>
          <CardHeader><CardTitle>Uploaded files</CardTitle></CardHeader>
          <CardBody>
            <ul className="space-y-2 text-sm">
              {files.map((f) => (
                <li key={f.id} className="flex items-center justify-between rounded-lg bg-cream-200/50 px-3 py-2">
                  <span className="truncate text-ink-800">{f.original_name || f.file_path.split("/").pop()}</span>
                  <span className="text-xs text-neutral-500">{f.file_kind}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Status history</CardTitle></CardHeader>
        <CardBody>
          {events?.length ? (
            <ol className="space-y-4">
              {(events as StatusEvent[]).map((ev) => (
                <li key={ev.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-gold-500" />
                  <div>
                    <p className="text-sm text-ink-900"><StatusBadge status={ev.to_status} /></p>
                    {ev.note && <p className="mt-1 text-sm text-neutral-600">{ev.note}</p>}
                    <p className="mt-0.5 text-xs text-neutral-400">{formatDateTime(ev.created_at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-neutral-500">No status updates recorded yet.</p>
          )}
        </CardBody>
      </Card>

      <div className="flex flex-wrap gap-3">
        <WhatsAppButton href={businessWhatsAppLink("2348012345678", enquiryWhatsAppMessage(enquiry.enquiry_number))} />
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-neutral-600 hover:text-ink-900">
          ← Back to dashboard
        </Link>
      </div>
    </div>
  );
}
