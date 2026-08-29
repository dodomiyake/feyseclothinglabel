"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Invisible — subscribes to live changes on this order (status transitions,
 * dispatch/rider info) and refreshes the server-rendered page when one
 * lands, so a customer sitting on the order tracking page sees updates
 * without needing to reload.
 */
export function OrderRealtimeRefresh({ orderId }: { orderId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`order-${orderId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "dispatches", filter: `order_id=eq.${orderId}` }, () => router.refresh())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, router]);

  return null;
}
