"use client";

import { useActionState } from "react";
import { createStaffAction, type StaffActionState } from "@/lib/actions/staff";
import { Field, Input, Select } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";

const initialState: StaffActionState = {};

export function StaffForm() {
  const [state, formAction, pending] = useActionState(createStaffAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name" required><Input name="full_name" required /></Field>
        <Field label="Email" required><Input type="email" name="email" required /></Field>
      </div>
      <Field label="Temporary password" required hint="They can change it after signing in">
        <Input type="text" name="password" required minLength={8} placeholder="At least 8 characters" />
      </Field>
      <Field label="Role" required>
        <Select name="role" defaultValue="production" required>
          <option value="production">Production staff</option>
          <option value="admin">Administrator</option>
        </Select>
      </Field>
      {state.error && <p className="rounded-lg bg-terracotta-600/10 px-3 py-2 text-sm text-terracotta-700">{state.error}</p>}
      <Button type="submit" variant="gold" disabled={pending}>{pending ? "Creating…" : "Create account"}</Button>
    </form>
  );
}
