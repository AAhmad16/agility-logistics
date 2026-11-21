import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { SHIPMENT_SELECT, type Shipment } from "@/lib/types";
import { fmtTime, money, SERVICE_NAME, STATUS_LABEL } from "@/lib/format";
import { acceptJob, confirmPickup } from "../../../actions";
import { RouteMap } from "@/components/RouteMap";
import { DeliveryForm } from "@/components/DeliveryForm";
import { GeoTracker } from "@/components/GeoTracker";
import { LiveRefresh } from "@/components/LiveRefresh";

export default async function JobPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ pod?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await getSession();
  const supabase = await createClient();
  const { data } = await supabase.from("shipments").select(SHIPMENT_SELECT).eq("id", id).maybeSingle();
  if (!data) notFound();
  const s = data as unknown as Shipment;
  const mine = s.driver_id === session?.user.id;
  const live = mine && (s.status === "assigned" || s.status === "picked");

  return (
    <div className="pbody">
      <LiveRefresh shipmentId={s.id} />
      <div className="ph-top">
        <Link href="/driver" style={{ color: "var(--teal)", fontWeight: 700, textDecoration: "none" }}>‹ Jobs</Link>
        <span className="mono" style={{ fontSize: 13 }}>{s.waybill}</span>
      </div>
      {sp.error && <div className="alert err" role="alert">{sp.error}</div>}
      <RouteMap a={{ ...s.pickup, label: s.pickup.name }} b={{ ...s.dropoff, label: s.dropoff.name }} driver={s.driver_lat != null && s.driver_lng != null && mine ? { lat: s.driver_lat, lng: s.driver_lng } : null} />
      <div className="ph-card">
        <div className="payout">
          <div><span className={`pill st-${s.status}`}>{SERVICE_NAME[s.service]}</span><div style={{ marginTop: 6, fontSize: 13, color: "var(--muted)" }}>{STATUS_LABEL[s.status]}</div></div>
          <b>{money(s.driver_payout_cents)}</b>
        </div>
      </div>
      <div className="ph-card">
        <ul className="stops">
          <li><b>{s.pickup.name}</b><small>Pickup · {s.pickup.address}</small></li>
          <li className="drop"><b>{s.dropoff.name}</b><small>Delivery · {s.distance_mi} mi · {s.dropoff.address}</small></li>
        </ul>
      </div>
      <div className="ph-card">
        <dl className="kv">
          {s.promised_at && (<><dt>Deliver by</dt><dd><b>{fmtTime(s.promised_at)}</b> (on-time guarantee)</dd></>)}
          <dt>Package</dt><dd>{s.weight_lb} lb</dd>
          <dt>Reference</dt><dd>{s.reference ?? "None"}</dd>
          {s.notes && (<><dt>Notes</dt><dd>{s.notes}</dd></>)}
        </dl>
      </div>
      {live && <div style={{ marginTop: 10 }}><GeoTracker id={s.id} /></div>}
      <div style={{ marginTop: 14 }}>
        {s.status === "pending" && (
          <form action={acceptJob}><input type="hidden" name="id" value={s.id} /><button className="btn amber block">Accept job · {money(s.driver_payout_cents)}</button></form>
        )}
        {s.status === "assigned" && mine && (
          <form action={confirmPickup}><input type="hidden" name="id" value={s.id} /><button className="btn dark block">Confirm pickup</button></form>
        )}
        {s.status === "picked" && mine && !sp.pod && (
          <Link className="btn amber block" href={`/driver/job/${s.id}?pod=1`}>Arrived · get signature</Link>
        )}
        {s.status === "picked" && mine && sp.pod && (
          <div className="ph-card" style={{ marginTop: 0 }}>
            <h4 className="ph-h4" style={{ marginTop: 0 }}>Proof of delivery</h4>
            <DeliveryForm id={s.id} recipientPlace={s.dropoff.name} payoutCents={s.driver_payout_cents} />
          </div>
        )}
        {s.status === "delivered" && <Link className="btn dark block" href="/driver">Back to jobs</Link>}
      </div>
    </div>
  );
}
