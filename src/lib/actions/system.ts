import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole, WorkflowStatus } from "@/lib/types";

/** Writes a notification for a specific user, bypassing RLS via the service role. */
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
}

/** Notifies every admin user of an event (e.g. a new enquiry or payment evidence). */
export async function notifyAdmins(params: { type: string; title: string; body: string; entityType?: string; entityId?: string }) {
  const admin = createAdminClient();
  const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
  if (!admins?.length) return;
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
}
