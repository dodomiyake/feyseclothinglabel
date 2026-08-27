# Feyse Clothing Labels

A WhatsApp-first platform for a UK-managed, Nigeria-produced clothing label
business. Customers submit enquiries, review quotations and invoices, upload
proof of bank transfer, and track production and dispatch — all without
having to leave WhatsApp for the parts of the process they already use it
for. Staff get a shared operations dashboard covering enquiries, quotations,
invoices, payment verification, production, quality control and dispatch.

Built with Next.js (App Router) + TypeScript + Tailwind CSS + Supabase
(Postgres, Auth, Storage, Row Level Security).

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions)
- **TypeScript**, **Tailwind CSS v4**
- **Supabase**: Postgres database, Auth, private Storage, Row Level Security
- **@react-pdf/renderer** for server-generated quotation/invoice PDFs
- **zod** for server-side validation

## 1. Create a Supabase project

1. Create a new project at [supabase.com](https://supabase.com).
2. In the SQL editor (or via the Supabase CLI), run the migrations in
   `supabase/migrations/` **in order**:
   - `0001_init.sql` — tables, enums, triggers, document numbering
   - `0002_rls.sql` — Row Level Security policies for every table
   - `0003_storage.sql` — private storage buckets (`artwork`,
     `payment-evidence`, `production-photos`, `dispatch-proof`) plus one
     public bucket (`business-assets`) for the logo/product images, with
     matching storage policies
3. Optionally load `supabase/seed.sql` for realistic sample data (products,
   bank accounts, message templates, and a handful of sample customers,
   enquiries, quotations, invoices, payments, orders and dispatches across
   every stage of the workflow). It has no dependency on `auth.users`.
4. In **Authentication → Providers**, email/password sign-in is enabled by
   default. Decide whether to require email confirmation — the sign-up flow
   handles both cases.

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the values from
**Project Settings → API**:

```bash
cp .env.example .env.local
```

`SUPABASE_SERVICE_ROLE_KEY` is required — it powers the trusted server-side
paths that must bypass RLS by design: anonymous enquiry submission, secure
WhatsApp portal links, and writing notifications/audit log entries on
another user's behalf. It is never sent to the browser.

## 3. Create your first admin and production accounts

Every new sign-up gets the `customer` role by default (see the
`handle_new_user` trigger). To create staff accounts:

1. Sign up normally through `/sign-up`, **or** create the user directly in
   Supabase Auth (dashboard → Authentication → Users → Add user).
2. Promote them by updating their profile role:

   ```sql
   update profiles set role = 'admin' where email = 'you@feyseclothinglabels.com';
   -- or role = 'production' for a Nigeria production team member
   ```

Admins land on `/admin/dashboard`, production staff on `/production`,
customers on `/dashboard` — sign-in redirects by role automatically.

## 4. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How the workflow maps to the schema

- **Enquiry** (`enquiries`) — the initial request. Carries a single
  `status` field that spans the full business workflow (draft → submitted →
  … → completed, plus on-hold/cancelled/refund variants), so the customer
  and admin always see one authoritative status per enquiry.
- **Quotation** (`quotations`) — proposed specification, pricing and
  validity period. Versioned; never auto-accepted.
- **Invoice** (`invoices`) — issued only after a quotation is accepted.
  Carries its own bank account reference and due date.
- **Payment** (`payments`) — one row per submission attempt (a rejected
  payment can be resubmitted). Confirmation is always a manual admin action.
- **Order** (`orders`) — created **only** once an admin confirms payment.
  This is what authorises production; nothing before this point is a paid
  order.
- **Production job / QC / Dispatch** (`production_jobs`, `qc_checklists`,
  `dispatches`) — one each per order, tracked by the Nigeria-based
  production team through to a rider handover.

`status_events`, `enquiry_revisions` and `whatsapp_notes` keep a full audit
trail of status changes, specification changes and WhatsApp conversation
context respectively. `audit_log` records administrative actions.

## Access model

- **Customers** see only their own enquiries, quotations, invoices,
  payments, orders and files (Row Level Security, not application-level
  filtering).
- **Production staff** see only production jobs assigned to them, and the
  approved specification/artwork needed to produce them — no pricing,
  payment or internal WhatsApp-note access.
- **Admins** have full access and are the only role that can verify
  payments, change prices, issue invoices or authorise production.
- All file storage (artwork, payment evidence, production photos, proof of
  delivery) is private; the app always serves files through short-lived
  signed URLs generated server-side.
- A visitor arriving from WhatsApp without an account can submit an enquiry
  and revisit its confirmation page via a single-use, expiring secure link
  (`secure_links`) — full interactive actions (accepting a quotation,
  submitting payment) require creating an account, which is one click from
  that page.

## WhatsApp integration (v1)

- A "Chat on WhatsApp" action appears throughout the app, pre-filled with
  the relevant enquiry/order number (`src/lib/whatsapp.ts`).
- `message_templates` stores reusable copy for enquiry acknowledgement,
  quotation sent, invoice issued, payment confirmed/rejected, production
  started/completed and dispatch notices — ready to be sent manually today,
  or wired into the official WhatsApp Business API later without changing
  the data model.
- Admins can log an enquiry that came in purely over WhatsApp
  (`/admin/enquiries/new`), attaching a summary note, without the customer
  ever touching the web app.

## What's intentionally out of scope for v1

- Automated WhatsApp messaging (manual "chat" links and copyable templates
  only — the schema and message templates are structured so this can be
  automated later).
- Online/automated payment verification (manual bank-transfer proof review
  only, matching the brief).
- A dispatch-rider marketplace (riders are recorded manually per order).
- Multi-currency checkout (amounts are NGN-denominated today; `currency`
  columns exist throughout so more currencies can be added without a schema
  change).

## Project structure

```
src/app/                    Public site, customer portal, admin, production
src/components/ui/          Low-level UI primitives
src/components/domain/      Feature components (forms, status badges, etc.)
src/components/layout/      Header/footer/dashboard shell
src/lib/actions/            Server Actions (mutations), grouped by domain
src/lib/supabase/           Browser / server / admin (service-role) clients
src/lib/workflow.ts         Status labels, tone, customer-facing timeline
src/lib/pdf/                @react-pdf/renderer quotation/invoice documents
supabase/migrations/        SQL schema, RLS policies, storage buckets
supabase/seed.sql           Realistic sample data
```
