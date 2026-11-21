import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { SHIPMENT_SELECT, type Profile, type Shipment } from "@/lib/types";
import { fmtDateTime, money, SERVICE_NAME, STATUS_LABEL } from "@/lib/format";
import { assignDriver, logout } from "../actions";
import { LiveRefresh } from "@/components/LiveRefresh";
import { LogoMark } from "@/components/Logo";

export const metadata = { title: "Dispatch" };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { profile } = await requireRole("admin");
  const supabase = await createClient();
  const [{ data }, { data: drv }, { data: qr }] = await Promise.all([
    supabase.from("shipments").select(SHIPMENT_SELECT).order("created_at", { ascending: false }).limit(200),
    supabase.from("profiles").select("id, full_name").eq("role", "driver").order("full_name"),
    supabase.from("quote_requests").select("id, created_at, name, company, email, phone, message").order("created_at", { ascending: false }).limit(20),
  ]);
  const quotes = (qr ?? []) as { id: string; created_at: string; name: string; company: string | null; email: string | null; phone: string | null; message: string | null }[];
  const ships = (data ?? []) as unknown as Shipment[];
  const drivers = (drv ?? []) as Pick<Profile, "id" | "full_name">[];
  const count = (st: string) => ships.filter((s) => s.status === st).length;
  return (
    <>
      <div className="topbar"><div className="in">
        <LogoMark size={28} /><b>Dispatch</b><span className="who">{profile.full_name}</span>
        <form action={logout}><button className="btn ghost sm" style={{ color: "#C9D6E2" }}>Sign out</button></form>
      </div></div>
      <div className="shell">
        <LiveRefresh />
        {error && <div className="alert err" role="alert">{error}</div>}
        <div className="sumrow" style={{ gridTemplateColumns: "repeat(4,1fr)", background: "#fff" }}>
          <div><b>{count("pending")}</b><span>Awaiting driver</span></div>
          <div><b>{count("assigned")}</b><span>Heading to pickup</span></div>
          <div><b>{count("picked")}</b><span>In transit</span></div>
          <div><b>{count("delivered")}</b><span>Delivered</span></div>
        </div>
        {quotes.length > 0 && (
          <div className="tw" style={{ background: "#fff", marginBottom: 18 }}>
            <table>
              <thead><tr><th>Quote request</th><th>Contact</th><th>Message</th><th>Received</th></tr></thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id}>
                    <td><b>{q.name}</b>{q.company ? <small style={{ display: "block", color: "var(--muted)" }}>{q.company}</small> : null}</td>
                    <td>{q.phone ? <a href={`tel:${q.phone}`} style={{ color: "var(--teal)", fontWeight: 600 }}>{q.phone}</a> : null}{q.phone && q.email ? <br /> : null}{q.email ? <a href={`mailto:${q.email}`} style={{ color: "var(--teal)", fontWeight: 600 }}>{q.email}</a> : null}</td>
                    <td>{q.message ?? ""}</td>
                    <td className="nw">{fmtDateTime(q.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="tw" style={{ background: "#fff" }}>
          <table>
            <thead><tr><th>Waybill</th><th>Route</th><th>Service</th><th>Status</th><th>Driver</th><th>Booked</th><th className="num">Price</th></tr></thead>
            <tbody>
              {ships.map((s) => (
                <tr key={s.id}>
                  <td className="mono nw">{s.waybill}</td>
                  <td className="route-t">{s.pickup.name} to {s.dropoff.name}<small>{s.reference ?? ""}</small></td>
                  <td className="nw">{SERVICE_NAME[s.service]}</td>
                  <td><span className={`pill st-${s.status}`}>{STATUS_LABEL[s.status]}</span></td>
                  <td>
                    {s.status === "pending" ? (
                      <form action={assignDriver} style={{ display: "flex", gap: 6 }}>
                        <input type="hidden" name="id" value={s.id} />
                        <select name="driver" aria-label={`Assign driver to ${s.waybill}`} style={{ padding: "5px 6px", borderRadius: 8, border: "1.5px solid var(--line)" }} required>
                          <option value="">Choose driver</option>
                          {drivers.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                        </select>
                        <button className="btn dark sm">Assign</button>
                      </form>
                    ) : (s.driver_name ?? "")}
                  </td>
                  <td className="nw">{fmtDateTime(s.created_at)}</td>
                  <td className="num mono">{money(s.price_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
