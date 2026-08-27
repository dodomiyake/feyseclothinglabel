"use client";

import { useActionState } from "react";
import { createInvoiceAction, type InvoiceActionState } from "@/lib/actions/invoices";
import { Field, Select, Textarea, Input } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import type { BankAccount } from "@/lib/types";

const initialState: InvoiceActionState = {};

export function InvoiceBuilderForm({
  quotationId,
  bankAccounts,
  defaultDueDate,
  defaultTerms,
}: {
  quotationId: string;
  bankAccounts: BankAccount[];
  defaultDueDate: string;
  defaultTerms: string;
}) {
  const [state, formAction, pending] = useActionState(createInvoiceAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="quotation_id" value={quotationId} />
      <Field label="Bank account to display" required>
        <Select name="bank_account_id" required defaultValue={bankAccounts.find((b) => b.is_default)?.id}>
          {bankAccounts.map((b) => (
            <option key={b.id} value={b.id}>{b.bank_name} — {b.account_number}</option>
          ))}
        </Select>
      </Field>
      <Field label="Due date" required>
        <Input type="date" name="due_date" required defaultValue={defaultDueDate} />
      </Field>
      <Field label="Terms">
        <Textarea name="terms" defaultValue={defaultTerms} />
      </Field>
      {state.error && <p className="rounded-lg bg-terracotta-600/10 px-3 py-2 text-sm text-terracotta-700">{state.error}</p>}
      <Button type="submit" size="lg" variant="gold" disabled={pending}>{pending ? "Issuing…" : "Issue invoice to customer"}</Button>
    </form>
  );
}
