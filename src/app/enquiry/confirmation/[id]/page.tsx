import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckCircle2, LayoutDashboard, Package } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { DashboardShell, type NavLink } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { WhatsAppButton } from "@/components/domain/whatsapp-button";
import { Card, CardBody } from "@/components/ui/card";
import { describeSpec } from "@/lib/spec";
import { businessWhatsAppLink, enquiryWhatsAppMessage } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Enquiry received — Feyse Clothing Labels" };

const CUSTOMER_NAV_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/orders", label: "My orders", icon: <Package className="h-4 w-4" /> },
];

export default async function EnquiryConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;

  const supabase = await createClient();
  const { data: userScoped, error: userScopedError } = await supabase.from("enquiries").select("*, customer:customers(*)").eq("id", id).maybeSingle();
  if (userScopedError) console.error("[EnquiryConfirmationPage] failed to load enquiry:", userScopedError);
  let enquiry = userScoped;

  let hasAccount = !!enquiry;
  if (!enquiry && t) {
    const admin = createAdminClient();
    const { data: link } = await admin.from("secure_links").select("*").eq("token", t).eq("enquiry_id", id).gt("expires_at", new Date().toISOString()).maybeSingle();
    if (link) {
      enquiry = (await admin.from("enquiries").select("*, customer:customers(*)").eq("id", id).maybeSingle()).data;
      hasAccount = false;
    }
  }

  // A signed-in customer whose own enquiry failed to load (e.g. a transient
  // DB error) should never be bounced to /sign-in — that looks identical to
  // being signed out. Only redirect when we know they're actually signed out.
  if (!enquiry) {
    if (userScopedError) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) throw userScopedError;
    }
    redirect("/sign-in");
  }

  const spec = describeSpec(enquiry);
  const whatsappLink = businessWhatsAppLink("2348012345678", enquiryWhatsAppMessage(enquiry.enquiry_number, spec));

  const confirmationContent = (
    <div className="w-full max-w-lg text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-sage-600" strokeWidth={1.5} />
      <h1 className="mt-4 font-serif text-3xl text-ink-950">Enquiry received</h1>
      <p className="mt-2 text-neutral-600">
        Thank you — enquiry <span className="font-medium text-ink-900">{enquiry.enquiry_number}</span> has
        been sent to our team. We typically respond within one business day.
      </p>

      <Card className="mt-8 text-left">
        <CardBody className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Enquiry number</span>
            <span className="font-medium text-ink-900">{enquiry.enquiry_number}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Specification</span>
            <span className="max-w-[60%] text-right text-ink-900">{spec}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Quantity</span>
            <span className="text-ink-900">{enquiry.quantity ?? "To be discussed"}</span>
          </div>
        </CardBody>
      </Card>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <WhatsAppButton href={whatsappLink} label="Follow up on WhatsApp" />
        {hasAccount ? (
          <Button href="/dashboard" variant="outline">Go to my dashboard</Button>
        ) : (
          <Button href="/sign-up" variant="outline">Create an account to track it</Button>
        )}
      </div>

      {!hasAccount && (
        <p className="mt-6 text-xs text-neutral-500">
          This is a one-time confirmation link. Save it or create a free account so you can revisit your
          enquiry, quotation and order status any time.
        </p>
      )}
    </div>
  );

  // A signed-in customer stays inside their portal shell instead of being
  // dropped onto the public marketing page after submitting.
  const profile = hasAccount ? await getCurrentProfile() : null;
  if (profile?.role === "customer") {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .is("read_at", null);

    return (
      <DashboardShell navLinks={CUSTOMER_NAV_LINKS} roleLabel="Customer portal" userName={profile.full_name} unreadCount={count ?? 0}>
        <div className="flex flex-1 items-center justify-center py-8">{confirmationContent}</div>
      </DashboardShell>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center bg-cream-200/40 px-4 py-16">{confirmationContent}</main>
      <SiteFooter />
    </>
  );
}
