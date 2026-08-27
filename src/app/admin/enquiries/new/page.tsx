import type { Metadata } from "next";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { WalkInEnquiryForm } from "@/components/domain/walk-in-enquiry-form";

export const metadata: Metadata = { title: "Log a WhatsApp enquiry — Feyse Clothing Labels" };

export default function NewWalkInEnquiryPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">New enquiry</p>
        <h1 className="mt-1 font-serif text-3xl text-ink-950">Log a WhatsApp enquiry</h1>
        <p className="mt-1 text-sm text-neutral-600">For a customer who contacted the business directly on WhatsApp.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Customer &amp; specification</CardTitle></CardHeader>
        <CardBody><WalkInEnquiryForm /></CardBody>
      </Card>
    </div>
  );
}
