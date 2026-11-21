import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/session";
import type { Shipment } from "@/lib/types";
import { fmtDateTime, money } from "@/lib/format";
import { SHIPMENT_SELECT } from "@/lib/types";

export const metadata = { title: "Earnings" };

export default async function Earnings() {
  const session = await getSession();
  const supabase = await createClient();
  const { data } = await supabase.from("shipments").select(SHIPMENT_SELECT).eq("driver_id", session?.user.id ?? "").eq("status", "delivered").order("delivered_at", { ascending: false }).limit(100);
  const list = (data ?? []) as Shipment[];
  const total = list.reduce((a, s) => a + s.driver_payout_cents, 0);
  return (
    <div className="pbody">
      <div className="ph-head"><div><h3>Earnings</h3><small>Paid weekly by direct deposit</small></div></div>
      <div className="earn">
        <div><b>{money(total)}</b><span>all deliveries</span></div>
        <div><b>{list.length}</b><span>deliveries</span></div>
      </div>
      <h4 className="ph-h4">Completed</h4>
      {list.length ? list.map((s) => (
        <div className="job" key={s.id} style={{ cursor: "default" }}>
          <div className="top"><span className="rt">{s.pickup.name} to {s.dropoff.name}</span><span className="pay">{money(s.driver_payout_cents)}</span></div>
          <small>{s.delivered_at ? fmtDateTime(s.delivered_at) : ""} · {s.waybill}</small>
        </div>
      )) : <div className="empty">Completed jobs show up here.</div>}
    </div>
  );
}
