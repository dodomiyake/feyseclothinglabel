import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { EnquiryForm } from "@/components/domain/enquiry-form";
import { Card, CardBody } from "@/components/ui/card";
import { WhatsAppButton } from "@/components/domain/whatsapp-button";
import { businessWhatsAppLink, generalEnquiryWhatsAppMessage } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Submit an enquiry — Feyse Clothing Labels" };

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

  let draftId: string | undefined;
  if (draft) {
    const admin = createAdminClient();
    let draftEnquiry = null;
    if (user) {
      const { data } = await supabase.from("enquiries").select("*, customer:customers(*)").eq("id", draft).eq("status", "draft").maybeSingle();
      draftEnquiry = data;
    } else if (t) {
      const { data: link } = await admin.from("secure_links").select("*").eq("token", t).eq("enquiry_id", draft).gt("expires_at", new Date().toISOString()).maybeSingle();
      if (link) {
        const { data } = await admin.from("enquiries").select("*, customer:customers(*)").eq("id", draft).eq("status", "draft").maybeSingle();
        draftEnquiry = data;
      }
    }
    if (draftEnquiry) {
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

  return (
    <>
      <SiteHeader />
      <main className="flex-1 bg-cream-200/40">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <div className="mb-8">
            <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">New enquiry</p>
            <h1 className="mt-2 font-serif text-3xl text-ink-950">Tell us about the labels you need</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Takes about 3 minutes. Prefer to talk it through? <span className="whitespace-nowrap">Chat with us directly.</span>
            </p>
            <WhatsAppButton
              href={businessWhatsAppLink("2348012345678", generalEnquiryWhatsAppMessage())}
              variant="outline"
              className="mt-3"
            />
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
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
