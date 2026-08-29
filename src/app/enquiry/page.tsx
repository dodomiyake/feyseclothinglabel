import type { Metadata } from "next";
import { LayoutDashboard, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { DashboardShell, type NavLink } from "@/components/layout/dashboard-shell";
import { EnquiryForm } from "@/components/domain/enquiry-form";
import { Card, CardBody } from "@/components/ui/card";
import { WhatsAppButton } from "@/components/domain/whatsapp-button";
import { businessWhatsAppLink, generalEnquiryWhatsAppMessage } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Submit an enquiry — Feyse Clothing Labels" };

const CUSTOMER_NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/orders", label: "My orders", icon: <Package className="h-4 w-4" /> },
];

export default async function EnquiryPage({
  searchParams,
}: {
  searchParams: Promise<{ label_type?: string; help?: string; draft?: string; t?: string }>;
}) {
  const { label_type, help, draft, t } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const defaultValues: Record<string, string> = {};

  if (user) {
    const { data: customer } = await supabase.from("customers").select("*").eq("user_id", user.id).maybeSingle();
    if (customer) {
      defaultValues.full_name = customer.full_name ?? "";
      defaultValues.business_name = customer.business_name ?? "";
      defaultValues.email = customer.email ?? "";
      defaultValues.whatsapp_number = customer.whatsapp_number ?? "";
      defaultValues.delivery_phone = customer.delivery_phone ?? "";
    }
  }

  // Editable states: a genuine draft, or an enquiry the admin sent back for
  // changes — both are cases where the customer needs to get back into this
  // form with their previous answers intact.
  const EDITABLE_STATUSES = ["draft", "changes_requested"];

  let draftId: string | undefined;
  let isChangesRequested = false;
  if (draft) {
    const admin = createAdminClient();
    let draftEnquiry = null;
    if (user) {
      const { data, error } = await supabase.from("enquiries").select("*, customer:customers(*)").eq("id", draft).in("status", EDITABLE_STATUSES).maybeSingle();
      if (error) console.error("[EnquiryPage] failed to load draft enquiry:", error);
      draftEnquiry = data;
    } else if (t) {
      const { data: link } = await admin.from("secure_links").select("*").eq("token", t).eq("enquiry_id", draft).gt("expires_at", new Date().toISOString()).maybeSingle();
      if (link) {
        const { data } = await admin.from("enquiries").select("*, customer:customers(*)").eq("id", draft).in("status", EDITABLE_STATUSES).maybeSingle();
        draftEnquiry = data;
      }
    }
    if (draftEnquiry) {
      isChangesRequested = draftEnquiry.status === "changes_requested";
      draftId = draftEnquiry.id;
      Object.assign(defaultValues, {
        full_name: draftEnquiry.customer?.full_name ?? defaultValues.full_name ?? "",
        business_name: draftEnquiry.customer?.business_name ?? defaultValues.business_name ?? "",
        email: draftEnquiry.customer?.email ?? defaultValues.email ?? "",
        whatsapp_number: draftEnquiry.customer?.whatsapp_number ?? defaultValues.whatsapp_number ?? "",
        delivery_phone: draftEnquiry.delivery_phone ?? "",
        material: draftEnquiry.material ?? "",
        width: draftEnquiry.width?.toString() ?? "",
        height: draftEnquiry.height?.toString() ?? "",
        quantity: draftEnquiry.quantity?.toString() ?? "",
        background_colour: draftEnquiry.background_colour ?? "",
        text_colour: draftEnquiry.text_colour ?? "",
        fold_type: draftEnquiry.fold_type ?? "",
        additional_instructions: draftEnquiry.additional_instructions ?? "",
        delivery_address: draftEnquiry.delivery_address ?? "",
        delivery_city: draftEnquiry.delivery_city ?? "",
        delivery_state: draftEnquiry.delivery_state ?? "",
        required_date: draftEnquiry.required_date ?? "",
        label_type: draftEnquiry.label_type ?? "",
      });
    }
  }

  // A signed-in customer stays inside their portal shell (nav, notifications,
  // sign out) instead of being dropped onto the public marketing page —
  // this is where "Reorder" and "start another enquiry" land them.
  const profile = await getCurrentProfile();
  const insidePortal = profile?.role === "customer";

  const formContent = (
    <>
      <div className="mb-8">
        <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">{isChangesRequested ? "Update your enquiry" : "New enquiry"}</p>
        <h1 className="mt-2 font-serif text-3xl text-ink-950">
          {isChangesRequested ? "Let's fix up the details" : "Tell us about the labels you need"}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          {isChangesRequested
            ? "Update whatever our team flagged, then resubmit — we'll take another look."
            : "Takes about 3 minutes. Prefer to talk it through? "}
          {!isChangesRequested && <span className="whitespace-nowrap">Chat with us directly.</span>}
        </p>
        {/* Signed-in customers already have a persistent WhatsApp button in
            the portal sidebar — skip the duplicate here. */}
        {!insidePortal && (
          <WhatsAppButton
            href={businessWhatsAppLink("2348012345678", generalEnquiryWhatsAppMessage())}
            variant="outline"
            className="mt-3"
          />
        )}
      </div>
      <Card>
        <CardBody>
          <EnquiryForm
            defaultValues={defaultValues}
            prefill={{ label_type, help: help === "1" }}
            draftId={draftId}
          />
        </CardBody>
      </Card>
    </>
  );

  if (profile?.role === "customer") {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .is("read_at", null);

    return (
      <DashboardShell navLinks={CUSTOMER_NAV_LINKS} roleLabel="Customer portal" userName={profile.full_name} unreadCount={count ?? 0}>
        <div className="mx-auto max-w-3xl">{formContent}</div>
      </DashboardShell>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-cream-200/40">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">{formContent}</div>
      </main>
      <SiteFooter />
    </>
  );
}
