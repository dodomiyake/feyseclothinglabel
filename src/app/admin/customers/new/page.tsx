"use client";

import { useActionState } from "react";
import { createCustomerAction, type CustomerActionState } from "@/lib/actions/customers";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Field, Input, Textarea } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";

const initialState: CustomerActionState = {};

export default function NewCustomerPage() {
  const [state, formAction, pending] = useActionState(createCustomerAction, initialState);

  return (
    <div className="max-w-lg space-y-6">
      <Breadcrumb items={[{ label: "Customers", href: "/admin/customers" }, { label: "Add customer" }]} />

      <div>
        <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">Customers</p>
        <h1 className="mt-1 font-serif text-3xl text-ink-950">Add a customer</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardBody>
          <form action={formAction} className="space-y-4">
            <Field label="Full name" required><Input name="full_name" required /></Field>
            <Field label="Business name" hint="Optional"><Input name="business_name" /></Field>
            <Field label="WhatsApp number" required><Input name="whatsapp_number" required /></Field>
            <Field label="Email" hint="Optional"><Input type="email" name="email" /></Field>
            <Field label="Delivery phone" hint="Optional"><Input name="delivery_phone" /></Field>
            <Field label="Notes" hint="Optional, internal only"><Textarea name="notes" /></Field>
            {state.error && <p className="rounded-lg bg-terracotta-600/10 px-3 py-2 text-sm text-terracotta-700">{state.error}</p>}
            <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create customer"}</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
