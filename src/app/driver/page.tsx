import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import { SHIPMENT_SELECT, type Shipment } from "@/lib/types";
import { fmtDay, money, SERVICE_NAME, STATUS_LABEL } from "@/lib/format";
import { logout } from "../actions";
import { LiveRefresh } from "@/components/LiveRefresh";

export const metadata = { title: "Jobs" };

function JobCard({ s, active }: { s: Shipment; active: boolean }) {
  return (
    <Link className={`job${active ? " active" : ""}`} href={`/driver/job/${s.id}`}>
      <div className="top">
        <span className={`pill st-${s.status}`}>{active ? STATUS_LABEL[s.status] : SERVICE_NAME[s.service]}</span>
        <span className="pay">{money(s.driver_payout_cents)}</span>
      </div>
      <div className="rt">{s.pickup.name} to {s.dropoff.name}</div>
      <small>{s.distance_mi} mi · {s.weight_lb} lb · {s.waybill}</small>
    </Link>
  );
}

export default async function DriverJobs({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const session = await getSession();
  const supabase = await createClient();
  const { data } = await supabase.from("shipments").select(SHIPMENT_SELECT).in("status", ["pending", "assigned", "picked", "delivered"]).order("created_at", { ascending: false }).limit(60);
  const all = (data ?? []) as Shipment[];
  const mine = all.filter((s) => s.driver_id === session?.user.id);
  const active = mine.filter((s) => s.status === "assigned" || s.status === "picked");
  const open = all.filter((s) => s.status === "pending");
  const today = fmtDay(new Date().toISOString());
  const doneToday = mine.filter((s) => s.status === "delivered" && s.delivered_at && fmtDay(s.delivered_at) === today);
  return (
    <div className="pbody">
      <LiveRefresh />
      <div className="ph-head">
        <div><h3>{session?.profile.full_name ?? "Driver"}</h3><small>{session?.profile.vehicle ?? "Agility driver"}</small></div>
        <form action={logout}><button className="btn ghost sm">Sign out</button></form>
      </div>
      {error && <div className="alert err" role="alert">{error}</div>}
      <div className="earn">
        <div><b>{money(doneToday.reduce((a, s) => a + s.driver_payout_cents, 0))}</b><span>earned today</span></div>
        <div><b>{doneToday.length}</b><span>deliveries today</span></div>
      </div>
      {active.length > 0 && (<><h4 className="ph-h4" style={{ marginTop: 4 }}>Your active job</h4>{active.map((s) => <JobCard key={s.id} s={s} active />)}</>)}
      <h4 className="ph-h4">Open jobs</h4>
      {open.length ? open.map((s) => <JobCard key={s.id} s={s} active={false} />) : <div className="empty">No open jobs right now. New bookings appear here the moment a client books.</div>}
    </div>
  );
}
