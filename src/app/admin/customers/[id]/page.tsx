import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/domain/status-badge";
import { WhatsAppButton } from "@/components/domain/whatsapp-button";
import { updateCustomerNotesAction, toggleCustomerActiveAction } from "@/lib/actions/customers";
import { Textarea } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/currency";
import { describeSpec } from "@/lib/spec";
import { businessWhatsAppLink, generalEnquiryWhatsAppMessage } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Customer — Feyse Clothing Labels" };

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
  if (!customer) notFound();

  const { data: enquiries } = await supabase.from("enquiries").select("*").eq("customer_id", id).order("created_at", { ascending: false });

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">Customer</p>
          <h1 className="mt-1 font-serif text-3xl text-ink-950">{customer.business_name || customer.full_name}</h1>
          {customer.business_name && <p className="text-sm text-neutral-500">{customer.full_name}</p>}
          {!customer.is_active && (
            <span className="mt-2 inline-block rounded-full bg-terracotta-600/10 px-2.5 py-0.5 text-xs font-medium text-terracotta-700">
              Deactivated
            </span>
          )}
        </div>
        <form action={toggleCustomerActiveAction}>
          <input type="hidden" name="customer_id" value={customer.id} />
          <input type="hidden" name="active" value={String(customer.is_active)} />
          <Button type="submit" variant="outline" size="sm">
            {customer.is_active ? "Deactivate customer" : "Reactivate customer"}
          </Button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
            <CardBody className="space-y-1.5 text-sm">
              <p className="text-ink-900">{customer.whatsapp_number}</p>
              {customer.email && <p className="text-neutral-600">{customer.email}</p>}
              {customer.delivery_phone && <p className="text-neutral-600">Delivery: {customer.delivery_phone}</p>}
              <p className="text-xs text-neutral-400">Source: {customer.source} · {customer.user_id ? "Registered account" : "Guest / WhatsApp"}</p>
              {!customer.user_id && (
                <p className="text-xs text-neutral-400">This customer has no login — deactivating only hides them from active flows.</p>
              )}
              <WhatsAppButton href={businessWhatsAppLink(customer.whatsapp_number, generalEnquiryWhatsAppMessage())} className="mt-2 w-full" variant="outline" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Internal notes</CardTitle></CardHeader>
            <CardBody>
              <form action={updateCustomerNotesAction} className="space-y-2">
                <input type="hidden" name="customer_id" value={customer.id} />
                <Textarea name="notes" defaultValue={customer.notes ?? ""} placeholder="Preferences, history, anything worth remembering." />
                <Button type="submit" size="sm">Save notes</Button>
              </form>
            </CardBody>
          </Card>
        </div>

        <section>
          <h2 className="mb-3 font-serif text-lg text-ink-950">Enquiries</h2>
          {enquiries?.length ? (
            <div className="space-y-2">
              {enquiries.map((e) => (
                <Link key={e.id} href={`/admin/enquiries/${e.id}`} className="block rounded-xl border border-ink-900/8 bg-cream-50 p-4 hover:shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-ink-900">{e.enquiry_number}</p>
                    <StatusBadge status={e.status} />
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">{describeSpec(e)}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">{formatDate(e.created_at)}</p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No enquiries from this customer yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
