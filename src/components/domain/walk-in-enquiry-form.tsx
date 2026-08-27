"use client";

import { useActionState } from "react";
import { createWalkInEnquiryAction, type AdminActionState } from "@/lib/actions/admin-enquiries";
import { Field, Input, Select, Textarea } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { LABEL_TYPE_META, FOLD_TYPE_META, MEASUREMENT_UNIT_META } from "@/lib/workflow";
import type { LabelType, FoldType, MeasurementUnit } from "@/lib/types";

const initialState: AdminActionState = {};

export function WalkInEnquiryForm() {
  const [state, formAction, pending] = useActionState(createWalkInEnquiryAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Customer / business name" required>
          <Input name="full_name" required placeholder="Segun Adeyemi" />
        </Field>
        <Field label="Business name" hint="Optional">
          <Input name="business_name" placeholder="Adeyemi Menswear" />
        </Field>
        <Field label="WhatsApp number" required>
          <Input name="whatsapp_number" required placeholder="2348023456705" />
        </Field>
        <Field label="Email" hint="Optional">
          <Input type="email" name="email" placeholder="segun@example.com" />
        </Field>
        <Field label="Delivery phone">
          <Input name="delivery_phone" placeholder="Same as WhatsApp if blank" />
        </Field>
        <Field label="Required by date" hint="Optional">
          <Input type="date" name="required_date" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Label type" hint="Optional">
          <Select name="label_type" defaultValue="">
            <option value="">Not yet decided</option>
            {(Object.entries(LABEL_TYPE_META) as [LabelType, { label: string }][]).map(([value, meta]) => (
              <option key={value} value={value}>{meta.label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Material" hint="Optional">
          <Input name="material" placeholder="Damask woven, satin finish" />
        </Field>
        <Field label="Width">
          <Input type="number" step="0.1" name="width" placeholder="6" />
        </Field>
        <Field label="Height">
          <Input type="number" step="0.1" name="height" placeholder="2.5" />
        </Field>
        <Field label="Unit">
          <Select name="measurement_unit" defaultValue="cm">
            {(Object.entries(MEASUREMENT_UNIT_META) as [MeasurementUnit, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </Field>
        <Field label="Quantity">
          <Input type="number" name="quantity" placeholder="500" />
        </Field>
        <Field label="Background colour">
          <Input name="background_colour" placeholder="Deep brown" />
        </Field>
        <Field label="Text / logo colour">
          <Input name="text_colour" placeholder="Muted gold" />
        </Field>
        <Field label="Fold / finishing type">
          <Select name="fold_type" defaultValue="">
            <option value="">Not yet decided</option>
            {(Object.entries(FOLD_TYPE_META) as [FoldType, string][]).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Delivery address">
        <Input name="delivery_address" placeholder="14 Adeola Odeku Street, Victoria Island" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City">
          <Input name="delivery_city" placeholder="Lagos" />
        </Field>
        <Field label="State">
          <Input name="delivery_state" placeholder="Lagos" />
        </Field>
      </div>

      <Field label="Additional instructions" hint="Optional">
        <Textarea name="additional_instructions" placeholder="Any notes from the customer." />
      </Field>

      <Field label="WhatsApp conversation note" hint="Optional — summarise what was discussed">
        <Textarea name="whatsapp_note" placeholder="Customer sent logo via WhatsApp and confirmed 500pcs woven labels." />
      </Field>

      {state.error && <p className="rounded-lg bg-terracotta-600/10 px-3 py-2 text-sm text-terracotta-700">{state.error}</p>}
      <Button type="submit" size="lg" disabled={pending}>{pending ? "Creating…" : "Create enquiry"}</Button>
    </form>
  );
}
