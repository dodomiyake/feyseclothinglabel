import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { LabelDocumentPdf } from "@/lib/pdf/document";
import { describeSpec } from "@/lib/spec";
import { STATUS_META } from "@/lib/workflow";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice, error } = await supabase.from("invoices").select("*").eq("id", id).single();
  if (error || !invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const [{ data: enquiry }, { data: quotation }, { data: business }, { data: bankAccount }] = await Promise.all([
    supabase.from("enquiries").select("*, customer:customers(*)").eq("id", invoice.enquiry_id).single(),
    supabase.from("quotations").select("*").eq("id", invoice.quotation_id).single(),
    supabase.from("business_settings").select("*").single(),
    invoice.bank_account_id
      ? supabase.from("bank_accounts").select("*").eq("id", invoice.bank_account_id).single()
      : Promise.resolve({ data: null }),
  ]);

  if (!enquiry || !quotation) return NextResponse.json({ error: "Related records not found" }, { status: 404 });

  const spec = describeSpec(enquiry);
  const customer = enquiry.customer;
  const addressParts = [enquiry.delivery_address, enquiry.delivery_city, enquiry.delivery_state].filter(Boolean);

  const pdfBuffer = await renderToBuffer(
    LabelDocumentPdf({
      kind: "Invoice",
      documentNumber: invoice.invoice_number,
      issueDate: invoice.issue_date,
      dueOrValidDate: invoice.due_date,
      dueOrValidLabel: "Due date",
      business: business!,
      customerName: customer?.business_name || customer?.full_name || "Customer",
      customerAddress: addressParts.join(", ") || "Address on file",
      enquiry,
      lineItem: { description: spec, quantity: quotation.quantity, unitPrice: quotation.unit_price, total: invoice.subtotal },
      deliveryFee: invoice.delivery_fee,
      discount: invoice.discount,
      total: invoice.total,
      currency: invoice.currency,
      terms: invoice.terms || business!.invoice_terms,
      bankAccount,
      statusLabel: STATUS_META[invoice.status === "payment_confirmed" ? "payment_confirmed" : "awaiting_payment"].label,
    })
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoice_number}.pdf"`,
    },
  });
}
