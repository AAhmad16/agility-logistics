"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { fmtDateTime, SERVICE_NAME, STATUS_LABEL } from "@/lib/format";
import type { ServiceLevel, ShipmentStatus } from "@/lib/types";

type Tracked = {
  waybill: string;
  status: ShipmentStatus;
  service: ServiceLevel;
  pickup: string;
  dropoff: string;
  events: { kind: string; at: string }[];
};

const STEPS: [string, string][] = [
  ["booked", "Booked"],
  ["assigned", "Driver assigned"],
  ["picked", "Picked up"],
  ["delivered", "Delivered"],
];

export function TrackBox() {
  const [id, setId] = useState("");
  const [res, setRes] = useState<Tracked | "none" | null>(null);
  const [busy, setBusy] = useState(false);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    if (!id.trim()) return;
    setBusy(true);
    const { data } = await createClient().rpc("track_shipment", { p_waybill: id });
    setRes(data ? (data as Tracked) : "none");
    setBusy(false);
  }

  return (
    <section className="track" id="track">
      <div className="wrap">
        <form className="trackrow" onSubmit={go}>
          <h3>Track a package</h3>
          <input className="mono" aria-label="Waybill number" placeholder="AT-1001" value={id} onChange={(e) => setId(e.target.value)} />
          <button className="btn dark" disabled={busy}>{busy ? "Looking…" : "Track"}</button>
        </form>
      </div>
      {res === "none" && (
        <div className="trackres wrap"><div className="err">No shipment found with that waybill. Check the number on your label.</div></div>
      )}
      {res && res !== "none" && (
        <div className="trackres wrap">
          <div className="box" style={{ gridTemplateColumns: "1fr" }}>
            <div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span className="mono">{res.waybill}</span>
                <span className={`pill st-${res.status}`}>{STATUS_LABEL[res.status]}</span>
              </div>
              <div className="route-t" style={{ marginTop: 8 }}>
                {res.pickup} to {res.dropoff}
                <small>{SERVICE_NAME[res.service]}</small>
              </div>
              <ul className="tl" style={{ marginTop: 14 }}>
                {STEPS.map(([k, label]) => {
                  const e = res.events.find((x) => x.kind === k);
                  return (
                    <li key={k} className={e ? "on" : ""}>
                      <b>{label}</b>
                      <small>{e ? fmtDateTime(e.at) : "Not yet"}</small>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
