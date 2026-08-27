import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessSettingsForm } from "@/components/domain/business-settings-form";
import { Field, Input, Checkbox } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { upsertBankAccountAction, toggleBankAccountActiveAction } from "@/lib/actions/settings";

export const metadata: Metadata = { title: "Business & bank settings — Feyse Clothing Labels" };

export default async function AdminBusinessSettingsPage() {
  const supabase = await createClient();
  const [{ data: business }, { data: bankAccounts }] = await Promise.all([
    supabase.from("business_settings").select("*").single(),
    supabase.from("bank_accounts").select("*").order("is_default", { ascending: false }),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">Settings</p>
        <h1 className="mt-1 font-serif text-3xl text-ink-950">Business &amp; bank details</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Business information</CardTitle></CardHeader>
        <CardBody><BusinessSettingsForm business={business!} /></CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>Nigerian bank accounts</CardTitle></CardHeader>
        <CardBody className="space-y-4">
          {bankAccounts?.map((b) => (
            <div key={b.id} className={`flex items-center justify-between rounded-xl border border-ink-900/8 p-3 text-sm ${b.active ? "" : "opacity-50"}`}>
              <div>
                <p className="font-medium text-ink-900">{b.bank_name} {b.is_default && <span className="ml-1 rounded-full bg-gold-400/25 px-2 py-0.5 text-[10px] text-gold-700">Default</span>}</p>
                <p className="text-neutral-600">{b.account_name} · {b.account_number}</p>
              </div>
              <form action={toggleBankAccountActiveAction}>
                <input type="hidden" name="id" value={b.id} />
                <input type="hidden" name="active" value={String(b.active)} />
                <Button type="submit" size="sm" variant="ghost">{b.active ? "Deactivate" : "Activate"}</Button>
              </form>
            </div>
          ))}

          <form action={upsertBankAccountAction} className="space-y-3 border-t border-ink-900/8 pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Bank name"><Input name="bank_name" required placeholder="Guaranty Trust Bank" /></Field>
              <Field label="Account name"><Input name="account_name" required placeholder="Feyse Clothing Labels Ltd" /></Field>
              <Field label="Account number"><Input name="account_number" required placeholder="0123456789" /></Field>
            </div>
            <Checkbox name="is_default" label="Set as default account shown on invoices" />
            <Button type="submit" size="sm" variant="gold">Add bank account</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
