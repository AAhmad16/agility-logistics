"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export type Quote = { miles: number; price_cents: number; eta_minutes: number } | null;

// Price and ETA always come from the database function, never from the browser.
export function useQuote(service: string, pickup: string, dropoff: string, weight: string) {
  const [quote, setQuote] = useState<Quote>(null);
  const valid = !!pickup && !!dropoff && pickup !== dropoff;
  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const { data } = await createClient().rpc("quote_shipment", {
        p_service: service,
        p_pickup: pickup,
        p_dropoff: dropoff,
        p_weight: Number(weight) || 1,
      });
      if (!cancelled) setQuote(Array.isArray(data) && data[0] ? (data[0] as NonNullable<Quote>) : null);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [valid, service, pickup, dropoff, weight]);
  return { quote: valid ? quote : null };
}
