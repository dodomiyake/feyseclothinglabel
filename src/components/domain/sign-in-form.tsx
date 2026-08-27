"use client";

import { useActionState } from "react";
import { signInAction, type AuthActionState } from "@/lib/actions/auth";
import { Field, Input } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";

const initialState: AuthActionState = {};

export function SignInForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email address" required>
        <Input type="email" name="email" required autoComplete="email" placeholder="you@brand.com" />
      </Field>
      <Field label="Password" required>
        <Input type="password" name="password" required autoComplete="current-password" placeholder="••••••••" />
      </Field>
      {state.error && <p className="rounded-lg bg-terracotta-600/10 px-3 py-2 text-sm text-terracotta-700">{state.error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
