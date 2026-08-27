"use client";

import { useActionState, useState } from "react";
import { reviewPaymentAction, type PaymentActionState } from "@/lib/actions/payments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form-fields";

const initialState: PaymentActionState = {};

export function PaymentReviewForm({ paymentId }: { paymentId: string }) {
  const [state, formAction, pending] = useActionState(reviewPaymentAction, initialState);
  const [rejecting, setRejecting] = useState(false);

  if (rejecting) {
    return (
      <form action={formAction} className="space-y-2">
        <input type="hidden" name="payment_id" value={paymentId} />
        <input type="hidden" name="decision" value="reject" />
        <Textarea name="reason" required placeholder="Reason the customer will see (e.g. amount doesn't match, account name mismatch)." />
        {state.error && <p className="text-sm text-terracotta-600">{state.error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" variant="danger" disabled={pending}>{pending ? "Rejecting…" : "Confirm rejection"}</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setRejecting(false)}>Cancel</Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex gap-2">
      <form action={formAction}>
        <input type="hidden" name="payment_id" value={paymentId} />
        <input type="hidden" name="decision" value="confirm" />
        <Button type="submit" size="sm" variant="gold" disabled={pending}>{pending ? "Confirming…" : "Confirm payment"}</Button>
      </form>
      <Button type="button" size="sm" variant="outline" className="text-terracotta-600" onClick={() => setRejecting(true)}>Reject</Button>
    </div>
  );
}
