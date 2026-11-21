"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

// Re-renders the page when shipments (or one shipment's events) change.
// Supabase Realtime respects row level security, so each user only hears about their own rows.
export function LiveRefresh({ shipmentId }: { shipmentId?: string }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 250);
    };
    const channel = supabase
      .channel(`live-${shipmentId ?? "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "shipments", ...(shipmentId ? { filter: `id=eq.${shipmentId}` } : {}) }, refresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "shipment_events", ...(shipmentId ? { filter: `shipment_id=eq.${shipmentId}` } : {}) }, refresh)
      .subscribe();
    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [router, shipmentId]);
  return null;
}
