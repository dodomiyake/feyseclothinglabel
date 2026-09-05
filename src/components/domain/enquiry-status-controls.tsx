"use client";

import { useActionState, useState } from "react";
import { retryEnquiryCrmSyncAction, updateEnquiryStatusAction } from "@/lib/actions/admin-enquiries";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form-fields";
import type { WorkflowStatus } from "@/lib/types";

// An enquiry is marked "under review" automatically the moment an admin
// opens it (see autoMarkUnderReview) — "under review" already means
// "we're on it, not moving forward yet," which is what a separate "on
// hold" state was for. "Mark under review" only still shows up as a
// manual action for the rare enquiry that was put on hold before this
// changed, so it can be resumed.
const QUICK_ACTIONS: { status: WorkflowStatus; label: string; variant: "outline" | "gold" | "danger" }[] = [
  { status: "under_review", label: "Mark under review", variant: "outline" },
  { status: "cancelled", label: "Cancel enquiry", variant: "danger" },
];

export function HubSpotSyncControl({ enquiryId }: { enquiryId: string }) {
  const [crmState, crmAction, crmPending] = useActionState(retryEnquiryCrmSyncAction, {});

  return (
    <form action={crmAction} className="space-y-2">
      <input type="hidden" name="enquiry_id" value={enquiryId} />
      <Button type="submit" size="sm" variant="gold" className="w-full" disabled={crmPending}>
        {crmPending ? "Syncing…" : "Sync with HubSpot"}
      </Button>
      {crmState.message ? (
        <p
          role="status"
          aria-live="polite"
          className={crmState.status === "error" ? "text-sm text-red-700" : "text-sm text-green-700"}
        >
          {crmState.message}
        </p>
      ) : null}
    </form>
  );
}

export function EnquiryStatusControls({ enquiryId, currentStatus }: { enquiryId: string; currentStatus: WorkflowStatus }) {
  const [requestingChanges, setRequestingChanges] = useState(false);

  if (requestingChanges) {
    return (
      <form action={updateEnquiryStatusAction} className="space-y-2">
        <input type="hidden" name="enquiry_id" value={enquiryId} />
        <input type="hidden" name="status" value="changes_requested" />
        <Textarea name="note" required placeholder="What's missing or needs correcting? The customer will see this." />
        <div className="flex gap-2">
          <Button type="submit" size="sm">Request changes</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setRequestingChanges(false)}>Cancel</Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" size="sm" variant="outline" onClick={() => setRequestingChanges(true)}>
        Request changes / more info
      </Button>
      {QUICK_ACTIONS.filter((a) => a.status !== currentStatus).map((action) => {
        // "Mark under review" is really "take this off hold" once an
        // enquiry is on hold — label it as such so it's not mistaken for a
        // dead end.
        const label = action.status === "under_review" && currentStatus === "on_hold" ? "Resume enquiry" : action.label;
        return (
          <form key={action.status} action={updateEnquiryStatusAction}>
            <input type="hidden" name="enquiry_id" value={enquiryId} />
            <input type="hidden" name="status" value={action.status} />
            <Button type="submit" size="sm" variant={action.variant} className="w-full">{label}</Button>
          </form>
        );
      })}
    </div>
  );
}
