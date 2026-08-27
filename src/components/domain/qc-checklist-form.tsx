"use client";

import { saveQcChecklistAction } from "@/lib/actions/production";
import { Checkbox, Textarea } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import type { QcChecklist } from "@/lib/types";

const CHECKS: { key: keyof QcChecklist; label: string }[] = [
  { key: "correct_artwork", label: "Correct artwork" },
  { key: "correct_spelling", label: "Correct spelling" },
  { key: "correct_dimensions", label: "Correct dimensions" },
  { key: "correct_colours", label: "Correct colours" },
  { key: "correct_material", label: "Correct material" },
  { key: "correct_quantity", label: "Correct quantity" },
  { key: "acceptable_quality", label: "Acceptable print / weave quality" },
  { key: "packaging_completed", label: "Packaging completed" },
];

export function QcChecklistForm({ jobId, qc, canMarkReady }: { jobId: string; qc: QcChecklist | null; canMarkReady: boolean }) {
  return (
    <form action={saveQcChecklistAction} className="space-y-3">
      <input type="hidden" name="job_id" value={jobId} />
      <div className="space-y-2">
        {CHECKS.map((c) => (
          <Checkbox key={c.key} name={c.key} label={c.label} defaultChecked={!!qc?.[c.key]} disabled={!canMarkReady} />
        ))}
      </div>
      <Textarea name="notes" placeholder="QC notes (optional)" defaultValue={qc?.notes ?? ""} disabled={!canMarkReady} />
      {qc && (
        <p className={`text-xs font-medium ${qc.overall_result === "pass" ? "text-sage-600" : qc.overall_result === "fail" ? "text-terracotta-600" : "text-neutral-500"}`}>
          Result: {qc.overall_result === "pending" ? "Not yet checked" : qc.overall_result.toUpperCase()}
        </p>
      )}
      {canMarkReady && <Button type="submit" size="sm" variant="outline">Save checklist</Button>}
    </form>
  );
}
