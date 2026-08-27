"use client";

import { useActionState } from "react";
import { signUpAction, type AuthActionState } from "@/lib/actions/auth";
import { Field, Input } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";

const initialState: AuthActionState = {};

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  if (state.info) {
    return <p className="rounded-lg bg-sage-500/10 px-4 py-3 text-sm text-sage-600">{state.info}</p>;
  }

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Full name" required>
        <Input name="full_name" required autoComplete="name" placeholder="Amaka Obiora" />
      </Field>
      <Field label="Business / brand name" hint="Optional">
        <Input name="business_name" autoComplete="organization" placeholder="Amaka Studio" />
      </Field>
      <Field label="WhatsApp number" required>
        <Input name="whatsapp_number" required placeholder="2348012345678" />
      </Field>
      <Field label="Email address" required>
        <Input type="email" name="email" required autoComplete="email" placeholder="you@brand.com" />
      </Field>
      <Field label="Password" required hint="At least 8 characters">
        <Input type="password" name="password" required minLength={8} autoComplete="new-password" placeholder="••••••••" />
      </Field>
      {state.error && <p className="rounded-lg bg-terracotta-600/10 px-3 py-2 text-sm text-terracotta-700">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
