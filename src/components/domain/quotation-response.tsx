"use client";

import { useActionState, useState } from "react";
import { acceptQuotationAction, requestQuotationChangesAction, declineQuotationAction, type QuotationActionState } from "@/lib/actions/quotations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form-fields";

const initialState: QuotationActionState = {};

export function QuotationResponse({ quotationId }: { quotationId: string }) {
  const [mode, setMode] = useState<"idle" | "changes">("idle");
  const [acceptState, acceptAction, acceptPending] = useActionState(acceptQuotationAction, initialState);
  const [changesState, changesAction, changesPending] = useActionState(requestQuotationChangesAction, initialState);
  const [declineState, declineAction, declinePending] = useActionState(declineQuotationAction, initialState);

  const error = acceptState.error || changesState.error || declineState.error;

  if (mode === "changes") {
    return (
      <form action={changesAction} className="space-y-3">
        <input type="hidden" name="quotation_id" value={quotationId} />
        <Textarea name="note" required placeholder="Tell us what you'd like changed (size, colour, price, quantity...)" />
        {error && <p className="text-sm text-terracotta-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={changesPending}>{changesPending ? "Sending…" : "Send request"}</Button>
          <Button type="button" variant="ghost" onClick={() => setMode("idle")}>Cancel</Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-terracotta-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <form action={acceptAction}>
          <input type="hidden" name="quotation_id" value={quotationId} />
          <Button type="submit" variant="gold" disabled={acceptPending}>{acceptPending ? "Accepting…" : "Accept quotation"}</Button>
        </form>
        <Button type="button" variant="outline" onClick={() => setMode("changes")}>Request changes</Button>
        <form action={declineAction}>
          <input type="hidden" name="quotation_id" value={quotationId} />
          <input type="hidden" name="note" value="Declined by customer" />
          <Button type="submit" variant="ghost" disabled={declinePending} className="text-terracotta-600">Decline</Button>
        </form>
      </div>
    </div>
  );
}
