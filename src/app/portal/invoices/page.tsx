import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Invoice } from "@/lib/types";
import { fmtDay, money } from "@/lib/format";

export const metadata = { title: "Invoices" };

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ paid?: string; error?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("invoices").select("*, shipments(waybill, id)").order("issued_at", { ascending: false });
  const invs = (data ?? []) as (Invoice & { shipments: { waybill: string; id: string } | null })[];
  const open = invs.filter((i) => i.status === "open");
  return (
    <>
      <div className="ptitle"><h2>Invoices</h2></div>
      {sp.paid && <div className="alert ok" role="status">Payment received. Thank you.</div>}
      {sp.error && <div className="alert err" role="alert">{sp.error}</div>}
      <div className="sumrow">
        <div><b>{money(open.reduce((a, i) => a + i.amount_cents, 0))}</b><span>Open balance</span></div>
        <div><b>{open.length}</b><span>Open invoices</span></div>
        <div><b>Net 15</b><span>Payment terms</span></div>
      </div>
      {invs.length === 0 ? (
        <div className="empty">Invoices appear here as soon as a driver completes a delivery.</div>
      ) : (
        <div className="tw">
          <table>
            <thead><tr><th>Invoice</th><th>Waybill</th><th>Issued</th><th>Due</th><th className="num">Amount</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {invs.map((i) => (
                <tr key={i.id}>
                  <td className="mono nw">{i.number}</td>
                  <td className="mono nw">{i.shipments && <Link href={`/portal/s/${i.shipments.id}`} style={{ color: "var(--teal)", fontWeight: 600 }}>{i.shipments.waybill}</Link>}</td>
                  <td className="nw">{fmtDay(i.issued_at)}</td>
                  <td className="nw">{fmtDay(i.due_at)}</td>
                  <td className="num mono">{money(i.amount_cents)}</td>
                  <td><span className={`pill st-${i.status}`}>{i.status === "paid" ? "Paid" : "Open"}</span></td>
                  <td>
                    {i.status === "open" && (
                      <form action="/api/stripe/checkout" method="post">
                        <input type="hidden" name="invoice_id" value={i.id} />
                        <button className="btn dark sm">Pay now</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
