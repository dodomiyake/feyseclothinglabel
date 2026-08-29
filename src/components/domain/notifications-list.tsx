import Link from "next/link";
import { Bell } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/currency";
import { markNotificationReadAction, markAllNotificationsReadAction } from "@/lib/actions/notifications";
import type { Notification } from "@/lib/types";

type Role = "customer" | "admin" | "production";

function entityHref(role: Role, entityType: string | null, entityId: string | null) {
  if (!entityType || !entityId) return null;

  if (role === "admin") {
    switch (entityType) {
      case "enquiry":
        return `/admin/enquiries/${entityId}`;
      case "quotation":
        return "/admin/inbox";
      case "invoice":
        return "/admin/payments";
      case "order":
        return `/admin/production/${entityId}`;
      default:
        return null;
    }
  }

  if (role === "production") {
    return entityType === "order" ? `/production/${entityId}` : "/production";
  }

  switch (entityType) {
    case "enquiry":
      return `/enquiries/${entityId}`;
    case "quotation":
      return `/quotations/${entityId}`;
    case "invoice":
      return `/invoices/${entityId}`;
    case "order":
      return `/orders/${entityId}`;
    default:
      return null;
  }
}

export function NotificationsList({ notifications, role, redirectPath }: { notifications: Notification[]; role: Role; redirectPath: string }) {
  if (!notifications.length) {
    return <EmptyState icon={Bell} title="No notifications yet" description="Updates about your enquiries and orders will show up here." />;
  }

  const hasUnread = notifications.some((n) => !n.read_at);

  return (
    <div className="space-y-4">
      {hasUnread && (
        <form action={markAllNotificationsReadAction} className="flex justify-end">
          <input type="hidden" name="redirect" value={redirectPath} />
          <Button type="submit" size="sm" variant="outline">Mark all as read</Button>
        </form>
      )}
      <div className="space-y-2">
        {notifications.map((n) => {
          const href = entityHref(role, n.entity_type, n.entity_id);
          return (
            <Card key={n.id} className={!n.read_at ? "border-gold-500/40 bg-gold-400/5" : undefined}>
              <CardBody className="flex items-start justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-medium text-ink-900">{n.title}</p>
                  <p className="mt-0.5 text-sm text-neutral-600">{n.body}</p>
                  <p className="mt-1 text-xs text-neutral-400">{formatDateTime(n.created_at)}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {href && (
                    <Link href={href} className="text-xs font-medium text-terracotta-600 hover:underline">
                      View
                    </Link>
                  )}
                  {!n.read_at && (
                    <form action={markNotificationReadAction}>
                      <input type="hidden" name="notification_id" value={n.id} />
                      <input type="hidden" name="redirect" value={redirectPath} />
                      <button type="submit" className="text-xs text-neutral-400 hover:text-neutral-600">
                        Mark read
                      </button>
                    </form>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
