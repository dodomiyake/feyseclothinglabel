"use client";

import { useActionState } from "react";
import { upsertDispatchAction, type DispatchActionState } from "@/lib/actions/dispatch";
import { Field, Input } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import type { Dispatch } from "@/lib/types";

const initialState: DispatchActionState = {};

export function DispatchForm({ orderId, dispatch }: { orderId: string; dispatch: Dispatch | null }) {
  const [state, formAction, pending] = useActionState(upsertDispatchAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="order_id" value={orderId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Rider name" required>
          <Input name="rider_name" required defaultValue={dispatch?.rider_name ?? ""} placeholder="Ibrahim Musa" />
        </Field>
        <Field label="Rider phone" required>
          <Input name="rider_phone" required defaultValue={dispatch?.rider_phone ?? ""} placeholder="2348034567890" />
        </Field>
        <Field label="Dispatch company" hint="Optional">
          <Input name="dispatch_company" defaultValue={dispatch?.dispatch_company ?? ""} placeholder="GIG Logistics" />
        </Field>
        <Field label="Tracking reference" hint="Optional">
          <Input name="tracking_reference" defaultValue={dispatch?.tracking_reference ?? ""} placeholder="GIG-LG-88213" />
        </Field>
        <Field label="Collection date & time" required>
          <Input type="datetime-local" name="collection_at" required defaultValue={dispatch?.collection_at?.slice(0, 16) ?? ""} />
        </Field>
        <Field label="Dispatch fee (NGN)">
          <Input type="number" step="0.01" name="dispatch_fee" defaultValue={dispatch?.dispatch_fee ?? 3000} />
        </Field>
      </div>
      {state.error && <p className="rounded-lg bg-terracotta-600/10 px-3 py-2 text-sm text-terracotta-700">{state.error}</p>}
      <Button type="submit" variant="gold" disabled={pending}>{pending ? "Saving…" : dispatch ? "Update dispatch" : "Dispatch order"}</Button>
    </form>
  );
}
