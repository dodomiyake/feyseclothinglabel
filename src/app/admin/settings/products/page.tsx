import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { upsertProductAction, toggleProductActiveAction } from "@/lib/actions/settings";
import { LABEL_TYPE_META } from "@/lib/workflow";
import type { LabelType } from "@/lib/types";

export const metadata: Metadata = { title: "Product & pricing settings — Feyse Clothing Labels" };

export default async function AdminProductSettingsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase.from("products").select("*").order("sort_order");

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">Settings</p>
        <h1 className="mt-1 font-serif text-3xl text-ink-950">Product &amp; pricing</h1>
        <p className="mt-1 text-sm text-neutral-600">Starting prices shown to customers. Every enquiry still gets a tailored quotation.</p>
      </div>

      <div className="space-y-4">
        {products?.map((p) => (
          <Card key={p.id} className={p.active ? "" : "opacity-60"}>
            <CardBody>
              <form action={upsertProductAction} className="space-y-3">
                <input type="hidden" name="id" value={p.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Label type">
                    <Select name="label_type" defaultValue={p.label_type}>
                      {(Object.entries(LABEL_TYPE_META) as [LabelType, { label: string }][]).map(([value, meta]) => (
                        <option key={value} value={value}>{meta.label}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Name"><Input name="name" defaultValue={p.name} required /></Field>
                  <Field label="Base unit price (NGN)"><Input type="number" step="0.01" name="base_unit_price" defaultValue={p.base_unit_price} /></Field>
                  <Field label="Minimum quantity"><Input type="number" name="min_quantity" defaultValue={p.min_quantity} /></Field>
                </div>
                <Field label="Description"><Textarea name="description" defaultValue={p.description} /></Field>
                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm">Save</Button>
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    formAction={toggleProductActiveAction}
                    name="active"
                    value={String(p.active)}
                  >
                    {p.active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Add a new label type</CardTitle></CardHeader>
        <CardBody>
          <form action={upsertProductAction} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Label type">
                <Select name="label_type" defaultValue="other">
                  {(Object.entries(LABEL_TYPE_META) as [LabelType, { label: string }][]).map(([value, meta]) => (
                    <option key={value} value={value}>{meta.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Name"><Input name="name" required placeholder="Woven Brand Label" /></Field>
              <Field label="Base unit price (NGN)"><Input type="number" step="0.01" name="base_unit_price" placeholder="85" /></Field>
              <Field label="Minimum quantity"><Input type="number" name="min_quantity" placeholder="200" /></Field>
            </div>
            <Field label="Description"><Textarea name="description" placeholder="Short description shown to customers." /></Field>
            <Button type="submit" variant="gold" size="sm">Add product</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
