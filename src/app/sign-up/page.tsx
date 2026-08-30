import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SignUpForm } from "@/components/domain/sign-up-form";
import { Card, CardBody } from "@/components/ui/card";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export const metadata: Metadata = { title: "Create an account — Feyse Clothing Labels" };

export default function SignUpPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center bg-cream-200/60 px-4 py-16">
        <div className="w-full max-w-md">
          <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Create account" }]} className="mb-6" />
          <div className="mb-6 text-center">
            <p className="text-xs tracking-[0.3em] text-gold-700 uppercase">Customer portal</p>
            <h1 className="mt-2 font-serif text-3xl text-ink-950">Create your account</h1>
            <p className="mt-1 text-sm text-neutral-600">Track enquiries, quotations, invoices and orders in one place.</p>
          </div>
          <Card>
            <CardBody>
              <SignUpForm />
            </CardBody>
          </Card>
          <p className="mt-5 text-center text-sm text-neutral-600">
            Already have an account? <Link href="/sign-in" className="font-medium text-terracotta-600 hover:text-terracotta-700">Sign in</Link>
          </p>
          <p className="mt-3 text-center text-xs text-neutral-600">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="font-medium text-terracotta-600 hover:text-terracotta-700">Terms of service</Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-terracotta-600 hover:text-terracotta-700">Privacy policy</Link>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
