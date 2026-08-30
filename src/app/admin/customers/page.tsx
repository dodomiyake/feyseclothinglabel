import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Customers — Feyse Clothing Labels" };

export default async function AdminCustomersPage() {
  const supabase = await createClient();
  const { data: customers } = await supabase.from("customers").select("*, enquiries(count)").order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.3em] text-gold-700 uppercase">Customers</p>
          <h1 className="mt-1 font-serif text-3xl text-ink-950">Customer records</h1>
        </div>
        <Button href="/admin/customers/new" variant="gold"><Plus className="h-4 w-4" /> Add customer</Button>
      </div>

      {customers?.length ? (
        <div className="overflow-hidden rounded-2xl border border-ink-900/8 bg-cream-50">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-ink-900/8 bg-cream-200/50 text-left text-xs text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">WhatsApp</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Enquiries</th>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-ink-900/6 last:border-0 hover:bg-cream-200/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${c.id}`} className="font-medium text-ink-900 hover:text-terracotta-600">
                      {c.business_name || c.full_name}
                    </Link>
                    {c.business_name && <p className="text-xs text-neutral-600">{c.full_name}</p>}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{c.whatsapp_number}</td>
                  <td className="px-4 py-3 text-neutral-600 capitalize">{c.source}</td>
                  <td className="px-4 py-3 text-neutral-600">{c.enquiries?.[0]?.count ?? 0}</td>
                  <td className="px-4 py-3 text-neutral-600">{c.user_id ? "Registered" : "Guest"}</td>
                  <td className="px-4 py-3">
                    {c.is_active ? (
                      <span className="text-neutral-600">Active</span>
                    ) : (
                      <span className="rounded-full bg-terracotta-600/10 px-2 py-0.5 text-xs font-medium text-terracotta-700">Deactivated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <EmptyState icon={Users} title="No customers yet" description="Customers appear here once they submit an enquiry or you add them manually." />
      )}
    </div>
  );
}
