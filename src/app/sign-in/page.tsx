import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SignInForm } from "@/components/domain/sign-in-form";
import { Card, CardBody } from "@/components/ui/card";

export const metadata: Metadata = { title: "Sign in — Feyse Clothing Labels" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; confirmed?: string; error?: string }>;
}) {
  const { next, confirmed, error } = await searchParams;

  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center bg-cream-200/60 px-4 py-16">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <p className="text-xs tracking-[0.3em] text-gold-600 uppercase">Customer portal</p>
            <h1 className="mt-2 font-serif text-3xl text-ink-950">Welcome back</h1>
            <p className="mt-1 text-sm text-neutral-600">Sign in to track your enquiries, quotations and orders.</p>
          </div>
          {confirmed === "1" && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-sage-500/10 px-4 py-3 text-sm text-sage-600">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Email confirmed — please sign in.
            </div>
          )}
          {error === "confirmation_failed" && (
            <p className="mb-4 rounded-lg bg-terracotta-600/10 px-4 py-3 text-sm text-terracotta-700">
              That confirmation link is invalid or has expired. Please sign up again or contact us on WhatsApp.
            </p>
          )}
          <Card>
            <CardBody>
              <SignInForm next={next} />
            </CardBody>
          </Card>
          <p className="mt-5 text-center text-sm text-neutral-600">
            New to Feyse Clothing Labels? <Link href="/sign-up" className="font-medium text-terracotta-600 hover:text-terracotta-700">Create an account</Link>
          </p>
          <p className="mt-2 text-center text-sm text-neutral-600">
            Prefer WhatsApp? <Link href="/enquiry" className="font-medium text-terracotta-600 hover:text-terracotta-700">Start an enquiry</Link> without signing in first.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
