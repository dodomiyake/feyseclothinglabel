"use client";

import { useActionState } from "react";
import { updateBusinessSettingsAction, type SettingsActionState } from "@/lib/actions/settings";
import { Field, Input, Textarea } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import type { BusinessSettings } from "@/lib/types";

const initialState: SettingsActionState = {};

export function BusinessSettingsForm({ business }: { business: BusinessSettings }) {
  const [state, formAction, pending] = useActionState(updateBusinessSettingsAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Business name"><Input name="business_name" defaultValue={business.business_name} required /></Field>
      <Field label="Tagline"><Input name="tagline" defaultValue={business.tagline} /></Field>
      <Field label="Registered address"><Textarea name="registered_address" defaultValue={business.registered_address} /></Field>
      <Field label="Production address"><Textarea name="production_address" defaultValue={business.production_address} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Support WhatsApp number"><Input name="support_whatsapp_number" defaultValue={business.support_whatsapp_number} /></Field>
        <Field label="Support email"><Input type="email" name="support_email" defaultValue={business.support_email} /></Field>
        <Field label="Quotation validity (days)"><Input type="number" name="default_quotation_validity_days" defaultValue={business.default_quotation_validity_days} /></Field>
        <Field label="Invoice due (days)"><Input type="number" name="default_invoice_due_days" defaultValue={business.default_invoice_due_days} /></Field>
      </div>
      <Field label="Quotation terms"><Textarea name="quotation_terms" defaultValue={business.quotation_terms} /></Field>
      <Field label="Invoice terms"><Textarea name="invoice_terms" defaultValue={business.invoice_terms} /></Field>
      {state.error && <p className="rounded-lg bg-terracotta-600/10 px-3 py-2 text-sm text-terracotta-700">{state.error}</p>}
      {state.success && <p className="rounded-lg bg-sage-500/10 px-3 py-2 text-sm text-sage-600">Settings saved.</p>}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>
    </form>
  );
}
