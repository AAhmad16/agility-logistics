export type Role = "client" | "driver" | "admin";
export type ServiceLevel = "sprint" | "sameday" | "nfo" | "stat";
export type ShipmentStatus = "pending" | "assigned" | "picked" | "delivered" | "cancelled";

export type Profile = {
  id: string;
  full_name: string | null;
  role: Role;
  company_id: string | null;
  phone: string | null;
  vehicle: string | null;
};

export type Loc = { id: string; name: string; address: string; lat: number; lng: number; is_hub: boolean };

export type Rate = {
  service: ServiceLevel;
  name: string;
  description: string;
  window_text: string;
  base_cents: number;
  per_mile_cents: number;
  lead_minutes: number;
  minutes_per_mile: number;
};

export type ShipmentEvent = { id: number; kind: string; label: string; created_at: string };

export type Shipment = {
  id: string;
  waybill: string;
  company_id: string;
  service: ServiceLevel;
  pickup_id: string;
  dropoff_id: string;
  weight_lb: number;
  reference: string | null;
  notes: string | null;
  distance_mi: number;
  price_cents: number;
  driver_payout_cents: number;
  status: ShipmentStatus;
  driver_id: string | null;
  driver_name: string | null;
  driver_lat: number | null;
  driver_lng: number | null;
  driver_pos_at: string | null;
  pod_name: string | null;
  pod_signature?: string | null; // only loaded on detail pages (large)
  pod_photo?: string | null; // only loaded on detail pages (large)
  eta_minutes: number | null;
  promised_at: string | null;
  late_credit_cents: number;
  track_token: string;
  created_at: string;
  accepted_at: string | null;
  picked_at: string | null;
  delivered_at: string | null;
  pickup: Loc;
  dropoff: Loc;
};

export type Invoice = {
  id: string;
  number: string;
  shipment_id: string;
  amount_cents: number;
  status: "open" | "paid" | "void";
  issued_at: string;
  due_at: string;
  paid_at: string | null;
  shipments?: { waybill: string } | null;
};

const JOINS = "pickup:locations!pickup_id(*), dropoff:locations!dropoff_id(*)";
// List pages: every column except the large signature and photo.
const COLS =
  "id, waybill, company_id, service, pickup_id, dropoff_id, weight_lb, reference, notes, distance_mi, price_cents, driver_payout_cents, status, driver_id, driver_name, driver_lat, driver_lng, driver_pos_at, pod_name, eta_minutes, promised_at, late_credit_cents, track_token, created_at, accepted_at, picked_at, delivered_at";
export const SHIPMENT_SELECT: string = `${COLS}, ${JOINS}`;
// Detail pages: everything, including proof of delivery.
export const SHIPMENT_FULL: string = `*, ${JOINS}`;

// Result of the public track_by_token function.
export type Tracked = {
  waybill: string;
  status: ShipmentStatus;
  service: ServiceLevel;
  pickup: { name: string; lat: number; lng: number };
  dropoff: { name: string; lat: number; lng: number };
  eta_minutes: number | null;
  promised_at: string | null;
  delivered_at: string | null;
  late_credit_cents: number;
  driver_first_name: string | null;
  driver_vehicle: string | null;
  driver_lat: number | null;
  driver_lng: number | null;
  driver_pos_at: string | null;
  pod_name: string | null;
  pod_photo: string | null;
  events: { kind: string; at: string }[];
};
