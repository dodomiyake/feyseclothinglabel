import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { LabelDocumentPdf } from "@/lib/pdf/document";
import { describeSpec } from "@/lib/spec";
import { STATUS_META } from "@/lib/workflow";
import type { WorkflowStatus } from "@/lib/types";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quotation, error } = await supabase.from("quotations").select("*").eq("id", id).single();
  if (error || !quotation) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });

  const { data: enquiry } = await supabase
    .from("enquiries")
    .select("*, customer:customers(*)")
    .eq("id", quotation.enquiry_id)
    .single();
  if (!enquiry) return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });

  const { data: business } = await supabase.from("business_settings").select("*").single();

  const spec = describeSpec(enquiry);
  const customer = enquiry.customer;
  const addressParts = [enquiry.delivery_address, enquiry.delivery_city, enquiry.delivery_state].filter(Boolean);

  const pdfBuffer = await renderToBuffer(
    LabelDocumentPdf({
      kind: "Quotation",
      documentNumber: quotation.quotation_number,
      issueDate: quotation.created_at,
      dueOrValidDate: quotation.valid_until,
      dueOrValidLabel: "Valid until",
      business: business!,
      customerName: customer?.business_name || customer?.full_name || "Customer",
      customerAddress: addressParts.join(", ") || "Address on file",
      enquiry,
      lineItem: { description: spec, quantity: quotation.quantity, unitPrice: quotation.unit_price, total: quotation.subtotal },
      deliveryFee: quotation.delivery_fee,
      discount: quotation.discount,
      total: quotation.total,
      currency: quotation.currency,
      terms: quotation.terms || business!.quotation_terms,
      bankAccount: null,
      statusLabel: STATUS_META["quotation_sent" as WorkflowStatus].label,
    })
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${quotation.quotation_number}.pdf"`,
    },
  });
}
