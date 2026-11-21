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
  pod_signature: string | null;
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

// Select string that joins pickup and dropoff locations onto a shipment.
export const SHIPMENT_SELECT = "*, pickup:locations!pickup_id(*), dropoff:locations!dropoff_id(*)";
