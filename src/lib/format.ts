import type { ShipmentStatus, ServiceLevel } from "./types";

const TZ = "America/Chicago";

export const money = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });

export const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: TZ });

export const fmtDateTime = (iso: string) => `${fmtDay(iso)}, ${fmtTime(iso)}`;

export const STATUS_LABEL: Record<ShipmentStatus, string> = {
  pending: "Awaiting driver",
  assigned: "Driver heading to pickup",
  picked: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const SERVICE_NAME: Record<ServiceLevel, string> = {
  sprint: "Sprint",
  sameday: "Same-day",
  nfo: "Next Flight Out",
  stat: "STAT medical",
};

export const etaText = (minutes: number) =>
  minutes >= 120 ? `${Math.round(minutes / 6) / 10} hours` : `${minutes} min`;

export function safeNext(next: string | null | undefined, fallback: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

// Keep in sync with app_settings.late_credit_pct in the database (the database applies the credit).
export const LATE_CREDIT_PCT = 25;

// Optional dispatch phone shown on the site. Set NEXT_PUBLIC_DISPATCH_PHONE in Vercel.
export const DISPATCH_PHONE = process.env.NEXT_PUBLIC_DISPATCH_PHONE?.trim() || "";
export const phoneHref = (phone: string) => phone.replace(/[^\d+]/g, "");
