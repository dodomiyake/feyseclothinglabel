"use client";

import { useActionState, useMemo, useState } from "react";
import { createQuotationAction, type QuotationActionState } from "@/lib/actions/quotations";
import { Field, Input, Textarea } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";

const initialState: QuotationActionState = {};

export function QuotationBuilderForm({
  enquiryId,
  suggestedUnitPrice,
  suggestedQuantity,
  defaultValidUntil,
  defaultTerms,
}: {
  enquiryId: string;
  suggestedUnitPrice: number;
  suggestedQuantity: number;
  defaultValidUntil: string;
  defaultTerms: string;
}) {
  const [state, formAction, pending] = useActionState(createQuotationAction, initialState);
  const [unitPrice, setUnitPrice] = useState(suggestedUnitPrice);
  const [quantity, setQuantity] = useState(suggestedQuantity);
  const [deliveryFee, setDeliveryFee] = useState(3000);
  const [discount, setDiscount] = useState(0);

  const subtotal = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);
  const total = subtotal + deliveryFee - discount;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="enquiry_id" value={enquiryId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Unit price (NGN)" required>
          <Input type="number" step="0.01" name="unit_price" required value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value) || 0)} />
        </Field>
        <Field label="Quantity" required>
          <Input type="number" name="quantity" required value={quantity} onChange={(e) => setQuantity(Number(e.target.value) || 0)} />
        </Field>
        <Field label="Delivery fee (NGN)">
          <Input type="number" step="0.01" name="delivery_fee" value={deliveryFee} onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)} />
        </Field>
        <Field label="Discount (NGN)">
          <Input type="number" step="0.01" name="discount" value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} />
        </Field>
        <Field label="Valid until" required>
          <Input type="date" name="valid_until" required defaultValue={defaultValidUntil} />
        </Field>
      </div>
      <Field label="Terms" hint="Shown on the quotation PDF">
        <Textarea name="terms" defaultValue={defaultTerms} />
      </Field>

      <div className="rounded-xl bg-cream-200/50 p-4 text-sm">
        <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
        <div className="flex justify-between"><span className="text-neutral-500">Delivery</span><span>{formatCurrency(deliveryFee)}</span></div>
        {discount > 0 && <div className="flex justify-between"><span className="text-neutral-500">Discount</span><span>-{formatCurrency(discount)}</span></div>}
        <div className="mt-2 flex justify-between border-t border-ink-900/10 pt-2 text-base font-medium text-ink-950"><span>Total</span><span>{formatCurrency(total)}</span></div>
      </div>

      {state.error && <p className="rounded-lg bg-terracotta-600/10 px-3 py-2 text-sm text-terracotta-700">{state.error}</p>}
      <Button type="submit" size="lg" variant="gold" disabled={pending}>{pending ? "Sending…" : "Send quotation to customer"}</Button>
    </form>
  );
}
