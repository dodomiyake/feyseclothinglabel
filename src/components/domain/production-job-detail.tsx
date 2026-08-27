import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import {
  startProductionAction,
  addProductionNoteAction,
  uploadProductionPhotoAction,
  completeProductionAction,
  markReadyForDispatchAction,
} from "@/lib/actions/production";
import { QcChecklistForm } from "@/components/domain/qc-checklist-form";
import { Textarea, Input } from "@/components/ui/form-fields";
import { formatDate, formatDateTime } from "@/lib/currency";
import { describeSpec } from "@/lib/spec";
import { LABEL_TYPE_META } from "@/lib/workflow";
import type { LabelType, Order, ProductionJob, ProductionNote, QcChecklist, Enquiry } from "@/lib/types";

export function ProductionJobDetail({
  job,
  order,
  enquiry,
  notes,
  photoUrls,
  qc,
  isAdmin,
  showFinance,
}: {
  job: ProductionJob;
  order: Order;
  enquiry: Enquiry;
  notes: ProductionNote[];
  photoUrls: { id: string; url: string | null; caption: string | null; created_at: string }[];
  qc: QcChecklist | null;
  isAdmin: boolean;
  showFinance: boolean;
}) {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">Production job</p>
          <h1 className="mt-1 font-serif text-3xl text-ink-950">{order.order_number}</h1>
          <p className="mt-1 text-sm text-neutral-600">{enquiry.label_type ? LABEL_TYPE_META[enquiry.label_type as LabelType].label : "Custom label"}</p>
        </div>
        <StatusBadge status={order.status} className="text-sm" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Approved specification</CardTitle></CardHeader>
            <CardBody>
              <p className="text-sm text-ink-900">{describeSpec(enquiry)}</p>
              <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                <div><dt className="text-xs text-neutral-500">Quantity</dt><dd>{enquiry.quantity}</dd></div>
                <div><dt className="text-xs text-neutral-500">Deadline</dt><dd>{formatDate(order.production_deadline)}</dd></div>
              </dl>
              {enquiry.additional_instructions && (
                <p className="mt-3 rounded-lg bg-cream-200/50 p-3 text-sm text-ink-800">{enquiry.additional_instructions}</p>
              )}
              {showFinance && (
                <p className="mt-3 text-xs text-neutral-500">Order number {order.order_number} · Authorised {formatDate(order.authorised_at)}</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Progress notes</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              <form action={addProductionNoteAction} className="space-y-2">
                <input type="hidden" name="job_id" value={job.id} />
                <Textarea name="note" required placeholder="e.g. Weaving started on machine 2." />
                <Button type="submit" size="sm">Add note</Button>
              </form>
              {notes.length ? (
                <ul className="space-y-2 border-t border-ink-900/8 pt-4 text-sm">
                  {notes.map((n) => (
                    <li key={n.id}>
                      <p className="text-ink-800">{n.note}</p>
                      <p className="text-xs text-neutral-400">{formatDateTime(n.created_at)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="border-t border-ink-900/8 pt-4 text-sm text-neutral-500">No progress notes yet.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Production photos</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              <form action={uploadProductionPhotoAction} encType="multipart/form-data" className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <input type="hidden" name="job_id" value={job.id} />
                <Input type="file" name="photo" accept="image/png,image/jpeg,image/webp" required className="sm:flex-1" />
                <Input type="text" name="caption" placeholder="Caption (optional)" className="sm:flex-1" />
                <Button type="submit" size="sm">Upload</Button>
              </form>
              {photoUrls.length ? (
                <div className="grid grid-cols-2 gap-3 border-t border-ink-900/8 pt-4 sm:grid-cols-3">
                  {photoUrls.map((p) =>
                    p.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={p.id} src={p.url} alt={p.caption ?? "Production photo"} className="aspect-square rounded-lg object-cover" />
                    ) : null
                  )}
                </div>
              ) : (
                <p className="border-t border-ink-900/8 pt-4 text-sm text-neutral-500">No photos uploaded yet.</p>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Stage</CardTitle></CardHeader>
            <CardBody className="space-y-2">
              {job.stage === "not_started" && (
                <form action={startProductionAction}>
                  <input type="hidden" name="job_id" value={job.id} />
                  <Button type="submit" className="w-full" variant="gold">Start production</Button>
                </form>
              )}
              {job.stage === "in_production" && (
                <form action={completeProductionAction}>
                  <input type="hidden" name="job_id" value={job.id} />
                  <Button type="submit" className="w-full" variant="gold">Mark production complete → send to QC</Button>
                </form>
              )}
              {job.stage === "quality_check" && (
                <p className="text-sm text-neutral-600">Complete the quality-control checklist to proceed.</p>
              )}
              {job.stage === "ready_for_dispatch" && (
                <p className="text-sm text-sage-600">Ready for dispatch. {isAdmin ? "Arrange dispatch from the Dispatch page." : "Awaiting dispatch by the admin team."}</p>
              )}
              {job.stage === "completed" && <p className="text-sm text-sage-600">This job is complete.</p>}
              {job.started_at && <p className="text-xs text-neutral-400">Started {formatDateTime(job.started_at)}</p>}
              {job.completed_at && <p className="text-xs text-neutral-400">Completed {formatDateTime(job.completed_at)}</p>}
            </CardBody>
          </Card>

          {(job.stage === "quality_check" || qc) && (
            <Card>
              <CardHeader><CardTitle>Quality control checklist</CardTitle></CardHeader>
              <CardBody>
                <QcChecklistForm jobId={job.id} qc={qc} canMarkReady={job.stage === "quality_check"} />
                {qc?.overall_result === "pass" && job.stage === "quality_check" && (
                  <form action={markReadyForDispatchAction} className="mt-3">
                    <input type="hidden" name="job_id" value={job.id} />
                    <Button type="submit" className="w-full" variant="gold">Mark ready for dispatch</Button>
                  </form>
                )}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
