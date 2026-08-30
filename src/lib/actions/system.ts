import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, SITE_URL } from "@/lib/email";
import type { UserRole, WorkflowStatus } from "@/lib/types";
import { enqueueCrmSync } from "@/lib/crm-sync";

const CUSTOMER_ENTITY_LINK: Record<string, (id: string) => string> = {
  enquiry: (id) => `/enquiries/${id}`,
  quotation: (id) => `/quotations/${id}`,
  invoice: (id) => `/invoices/${id}`,
  order: (id) => `/orders/${id}`,
};

/**
 * Writes a notification for a specific user, bypassing RLS via the service
 * role, and emails them too — the in-app notification alone is easy to
 * miss since nothing prompts the user to go check it.
 */
export async function notifyUser(params: {
  userId: string | null;
  type: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
}) {
  if (!params.userId) return;
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    entity_type: params.entityType ?? null,
    entity_id: params.entityId ?? null,
  });

  const { data: profile } = await admin.from("profiles").select("email").eq("id", params.userId).maybeSingle();
  if (profile?.email) {
    const path = params.entityType && params.entityId ? CUSTOMER_ENTITY_LINK[params.entityType]?.(params.entityId) : undefined;
    await sendEmail({
      to: profile.email,
      subject: params.title,
      body: params.body,
      ctaLabel: "View in your account",
      ctaHref: `${SITE_URL}${path ?? "/dashboard"}`,
    });
  }
}

const ADMIN_ENTITY_LINK: Record<string, (id: string) => string> = {
  enquiry: (id) => `/admin/enquiries/${id}`,
  quotation: () => `/admin/inbox`,
  invoice: () => `/admin/payments`,
  order: (id) => `/admin/production/${id}`,
};

/** Notifies every admin user of an event (e.g. a new enquiry or payment evidence). */
export async function notifyAdmins(params: { type: string; title: string; body: string; entityType?: string; entityId?: string }) {
  const admin = createAdminClient();
  const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
  if (admins?.length) {
    await admin.from("notifications").insert(
      admins.map((a) => ({
        user_id: a.id,
        type: params.type,
        title: params.title,
        body: params.body,
        entity_type: params.entityType ?? null,
        entity_id: params.entityId ?? null,
      }))
    );
  }

  const { data: business } = await admin.from("business_settings").select("support_email").single();
  if (business?.support_email) {
    const path = params.entityType && params.entityId ? ADMIN_ENTITY_LINK[params.entityType]?.(params.entityId) : undefined;
    await sendEmail({
      to: business.support_email,
      subject: params.title,
      body: params.body,
      ctaLabel: "Open in admin dashboard",
      ctaHref: `${SITE_URL}${path ?? "/admin/dashboard"}`,
    });
  }
}

export async function logAudit(params: {
  actorId: string | null;
  actorRole: UserRole | null;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
}) {
  const admin = createAdminClient();
  await admin.from("audit_log").insert({
    actor_id: params.actorId,
    actor_role: params.actorRole,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    before: params.before ?? null,
    after: params.after ?? null,
  });
}

export async function recordStatusEvent(params: {
  entityType: "enquiry" | "order";
  entityId: string;
  fromStatus: WorkflowStatus | null;
  toStatus: WorkflowStatus;
  note?: string;
  actorId: string | null;
}) {
  const admin = createAdminClient();
  await admin.from("status_events").insert({
    entity_type: params.entityType,
    entity_id: params.entityId,
    from_status: params.fromStatus,
    to_status: params.toStatus,
    note: params.note ?? null,
    actor_id: params.actorId,
  });

  if (params.entityType === "enquiry") {
    const { data: enquiry } = await admin.from("enquiries").select("customer_id").eq("id", params.entityId).maybeSingle();
    if (enquiry?.customer_id) {
      await enqueueCrmSync({
        eventType: "enquiry_stage_update",
        customerId: enquiry.customer_id,
        enquiryId: params.entityId,
      });
    }
  }
}
