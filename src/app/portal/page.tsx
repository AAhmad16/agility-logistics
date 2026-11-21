import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SHIPMENT_SELECT, type Invoice, type Shipment } from "@/lib/types";
import { fmtDateTime, money, SERVICE_NAME, STATUS_LABEL } from "@/lib/format";
import { LiveRefresh } from "@/components/LiveRefresh";

export const metadata = { title: "Shipments" };

export default async function PortalHome() {
  const supabase = await createClient();
  const [{ data }, { data: invs }] = await Promise.all([
    supabase.from("shipments").select(SHIPMENT_SELECT).order("created_at", { ascending: false }).limit(100),
    supabase.from("invoices").select("amount_cents, status").eq("status", "open"),
  ]);
  const ships = (data ?? []) as unknown as Shipment[];
  const openBal = ((invs ?? []) as Pick<Invoice, "amount_cents">[]).reduce((a, i) => a + i.amount_cents, 0);
  const active = ships.filter((s) => ["pending", "assigned", "picked"].includes(s.status)).length;
  return (
    <>
      <LiveRefresh />
      <div className="ptitle">
        <h2>Shipments</h2>
        <Link className="btn amber" href="/portal/new">New shipment</Link>
      </div>
      <div className="sumrow">
        <div><b>{active}</b><span>In progress</span></div>
        <div><b>{ships.filter((s) => s.status === "delivered").length}</b><span>Delivered</span></div>
        <div><b>{money(openBal)}</b><span>Open balance</span></div>
      </div>
      {ships.length === 0 ? (
        <div className="empty">No shipments yet. <Link href="/portal/new" style={{ color: "var(--teal)", fontWeight: 600 }}>Book your first one.</Link></div>
      ) : (
        <div className="tw">
          <table>
            <thead><tr><th>Waybill</th><th>Route</th><th>Service</th><th>Status</th><th>Booked</th><th className="num">Price</th></tr></thead>
            <tbody>
              {ships.map((s) => (
                <tr key={s.id}>
                  <td className="mono nw"><Link href={`/portal/s/${s.id}`} style={{ color: "var(--teal)", fontWeight: 600 }}>{s.waybill}</Link></td>
                  <td className="route-t">{s.pickup.name} to {s.dropoff.name}<small>{s.reference ?? ""}</small></td>
                  <td className="nw">{SERVICE_NAME[s.service]}</td>
                  <td><span className={`pill st-${s.status}`}>{STATUS_LABEL[s.status]}</span></td>
                  <td className="nw">{fmtDateTime(s.created_at)}</td>
                  <td className="num mono">{money(s.price_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
