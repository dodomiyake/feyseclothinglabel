"use client";

import { useState } from "react";
import { updateEnquiryStatusAction } from "@/lib/actions/admin-enquiries";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form-fields";
import type { WorkflowStatus } from "@/lib/types";

const QUICK_ACTIONS: { status: WorkflowStatus; label: string; variant: "outline" | "gold" | "danger" }[] = [
  { status: "under_review", label: "Mark under review", variant: "outline" },
  { status: "on_hold", label: "Put on hold", variant: "outline" },
  { status: "cancelled", label: "Cancel enquiry", variant: "danger" },
];

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
      {QUICK_ACTIONS.filter((a) => a.status !== currentStatus).map((action) => (
        <form key={action.status} action={updateEnquiryStatusAction}>
          <input type="hidden" name="enquiry_id" value={enquiryId} />
          <input type="hidden" name="status" value={action.status} />
          <Button type="submit" size="sm" variant={action.variant} className="w-full">{action.label}</Button>
        </form>
      ))}
    </div>
  );
}
