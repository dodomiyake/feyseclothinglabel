"use client";

import { useActionState } from "react";
import { submitPaymentEvidenceAction, type PaymentActionState } from "@/lib/actions/payments";
import { Field, Input } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";

const initialState: PaymentActionState = {};

export function PaymentEvidenceForm({ invoiceId, suggestedAmount }: { invoiceId: string; suggestedAmount: number }) {
  const [state, formAction, pending] = useActionState(submitPaymentEvidenceAction, initialState);

  return (
    <form action={formAction} className="space-y-4" encType="multipart/form-data">
      <input type="hidden" name="invoice_id" value={invoiceId} />
      <Field label="Amount paid" required>
        <Input type="number" step="0.01" name="amount_paid" required defaultValue={suggestedAmount} />
      </Field>
      <Field label="Payment date" required>
        <Input type="date" name="payment_date" required defaultValue={new Date().toISOString().slice(0, 10)} />
      </Field>
      <Field label="Sender's account name" required hint="Name on the account you transferred from">
        <Input name="sender_account_name" required placeholder="Amaka Obiora" />
      </Field>
      <Field label="Sending bank" hint="Optional">
        <Input name="sender_bank" placeholder="Access Bank" />
      </Field>
      <Field label="Proof of payment" required hint="Screenshot or receipt — PNG, JPG or PDF, up to 10MB">
        <Input type="file" name="evidence" required accept="image/png,image/jpeg,image/webp,application/pdf" />
      </Field>
      {state.error && <p className="rounded-lg bg-terracotta-600/10 px-3 py-2 text-sm text-terracotta-700">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Submitting…" : "Submit for verification"}
      </Button>
    </form>
  );
}
