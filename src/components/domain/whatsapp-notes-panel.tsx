"use client";

import { useRef } from "react";
import { addWhatsappNoteAction } from "@/lib/actions/admin-enquiries";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea, Select } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/currency";
import type { WhatsappNote } from "@/lib/types";

export function WhatsappNotesPanel({ enquiryId, notes }: { enquiryId: string; notes: WhatsappNote[] }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Card>
      <CardHeader><CardTitle>WhatsApp conversation notes</CardTitle></CardHeader>
      <CardBody className="space-y-4">
        <form
          ref={formRef}
          action={async (formData) => {
            await addWhatsappNoteAction(formData);
            formRef.current?.reset();
          }}
          className="space-y-2"
        >
          <input type="hidden" name="enquiry_id" value={enquiryId} />
          <div className="flex gap-2">
            <Select name="direction" defaultValue="inbound" className="w-40">
              <option value="inbound">From customer</option>
              <option value="outbound">To customer</option>
            </Select>
          </div>
          <Textarea name="note" required placeholder="Summarise what was discussed on WhatsApp — internal only, not visible to the customer." />
          <Button type="submit" size="sm">Add note</Button>
        </form>

        {notes.length ? (
          <ul className="space-y-3 border-t border-ink-900/8 pt-4">
            {notes.map((n) => (
              <li key={n.id} className="text-sm">
                <span className={`mr-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${n.direction === "inbound" ? "bg-sage-500/15 text-sage-600" : "bg-gold-400/20 text-gold-700"}`}>
                  {n.direction === "inbound" ? "From customer" : "To customer"}
                </span>
                <span className="text-ink-800">{n.note}</span>
                <p className="mt-0.5 text-xs text-neutral-400">{formatDateTime(n.created_at)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-ink-900/8 pt-4 text-sm text-neutral-500">No conversation notes yet.</p>
        )}
      </CardBody>
    </Card>
  );
}
