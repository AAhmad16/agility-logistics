import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SHIPMENT_FULL, type Invoice, type Shipment, type ShipmentEvent, type Tracked } from "@/lib/types";
import { fmtDateTime, money, SERVICE_NAME, STATUS_LABEL, fmtTime } from "@/lib/format";
import { cancelShipment } from "../../../actions";
import { LiveRefresh } from "@/components/LiveRefresh";
import { RouteMap } from "@/components/RouteMap";
import { ShareLink } from "@/components/ShareLink";

const STEPS: [string, string][] = [["booked", "Booked"], ["assigned", "Driver assigned"], ["picked", "Picked up"], ["delivered", "Delivered"]];

export default async function ShipmentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("shipments").select(SHIPMENT_FULL).eq("id", id).maybeSingle();
  if (!data) notFound();
  const s = data as unknown as Shipment;
  const [{ data: ev }, { data: inv }, { data: tr }] = await Promise.all([
    supabase.from("shipment_events").select("*").eq("shipment_id", id).order("created_at"),
    supabase.from("invoices").select("*").eq("shipment_id", id).maybeSingle(),
    supabase.rpc("track_by_token", { p_token: s.track_token }),
  ]);
  const tracked = tr as Tracked | null;
  const events = (ev ?? []) as ShipmentEvent[];
  const invoice = inv as Invoice | null;
  const live = s.status === "assigned" || s.status === "picked";
  const driver = live && s.driver_lat != null && s.driver_lng != null ? { lat: s.driver_lat, lng: s.driver_lng } : null;

  return (
    <>
      <LiveRefresh shipmentId={s.id} />
      <Link className="back" href="/portal">‹ All shipments</Link>
      <div className="ptitle">
        <h2 className="mono" style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 500 }}>{s.waybill}</h2>
        <span className={`pill st-${s.status}`}>{STATUS_LABEL[s.status]}</span>
      </div>
      {error && <div className="alert err" role="alert">{error}</div>}
      <div className="detail">
        <div>
          <RouteMap a={{ ...s.pickup, label: s.pickup.name }} b={{ ...s.dropoff, label: s.dropoff.name }} driver={driver} />
          {live && (
            <div className="eta">
              <b style={{ fontSize: 18 }}>{s.driver_name ?? "Driver"} {s.status === "assigned" ? "is heading to pickup" : "is on the way"}</b>
              <span className="lbl">{s.driver_pos_at ? `Location updated ${fmtTime(s.driver_pos_at)}` : "Waiting for location"}</span>
            </div>
          )}
          {s.status === "pending" && <div className="eta"><b style={{ fontSize: 18 }}>Waiting for a driver</b><span className="lbl">Dispatch is offering this job now</span></div>}
          {s.promised_at && s.status !== "cancelled" && (
            <div className="eta">
              <div>
                <div className="lbl">{s.status === "delivered" ? "Promised by" : "Delivery promised by"}</div>
                <b>{fmtTime(s.promised_at)}</b>
              </div>
              {s.status === "delivered" ? (
                s.late_credit_cents > 0
                  ? <span className="pill st-open">Late, {money(s.late_credit_cents)} credited</span>
                  : <span className="pill st-delivered">On time</span>
              ) : (
                <span className="pill st-picked">On-time guarantee</span>
              )}
            </div>
          )}
          <h4 className="sect">Progress</h4>
          <ul className="tl">
            {STEPS.map(([k, label]) => {
              const e = events.find((x) => x.kind === k);
              return (
                <li key={k} className={e ? "on" : ""}>
                  <b>{label}</b>
                  <small>{e ? `${e.label} · ${fmtDateTime(e.created_at)}` : "Not yet"}</small>
                </li>
              );
            })}
            {s.status === "cancelled" && <li className="on"><b>Cancelled</b><small>{fmtDateTime(events.at(-1)?.created_at ?? s.created_at)}</small></li>}
          </ul>
        </div>
        <div>
          <h4 className="sect" style={{ marginTop: 0 }}>Shipment</h4>
          <dl className="kv">
            <dt>Service</dt><dd>{SERVICE_NAME[s.service]}</dd>
            <dt>From</dt><dd>{s.pickup.name}</dd>
            <dt>To</dt><dd>{s.dropoff.name}</dd>
            <dt>Distance</dt><dd>{s.distance_mi} mi</dd>
            <dt>Weight</dt><dd>{s.weight_lb} lb</dd>
            <dt>Reference</dt><dd>{s.reference ?? "None"}</dd>
            <dt>Driver</dt><dd>{s.driver_name ? `${s.driver_name}${tracked?.driver_vehicle ? ` · ${tracked.driver_vehicle}` : ""}` : "Not assigned yet"}</dd>
            <dt>Price</dt><dd className="mono">{money(s.price_cents)}</dd>
          </dl>
          {s.notes && (<><h4 className="sect">Instructions</h4><p>{s.notes}</p></>)}
          {s.pod_name && (
            <>
              <h4 className="sect">Proof of delivery</h4>
              <p>Signed by <b>{s.pod_name}</b></p>
              {s.pod_photo && (
                <div className="sig">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="Photo of the delivered package" src={s.pod_photo} style={{ height: "auto", maxHeight: 320, width: "100%", objectFit: "contain" }} />
                </div>
              )}
              {s.pod_signature && (
                <div className="sig">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="Recipient signature" src={s.pod_signature} />
                </div>
              )}
            </>
          )}
          {s.status !== "cancelled" && (
            <>
              <h4 className="sect">Share tracking</h4>
              <ShareLink token={s.track_token} waybill={s.waybill} />
            </>
          )}
          {invoice && (
            <>
              <h4 className="sect">Invoice</h4>
              <p><span className="mono">{invoice.number}</span> · {money(invoice.amount_cents)} <span className={`pill st-${invoice.status}`} style={{ marginLeft: 6 }}>{invoice.status === "paid" ? "Paid" : "Open"}</span></p>
              <p style={{ marginTop: 8 }}><Link className="btn dark sm" href="/portal/invoices">View invoices</Link></p>
            </>
          )}
          {s.status === "pending" && (
            <form action={cancelShipment} style={{ marginTop: 18 }}>
              <input type="hidden" name="id" value={s.id} />
              <button className="btn ghost sm" style={{ color: "var(--red)" }}>Cancel shipment</button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
