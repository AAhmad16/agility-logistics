"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { fmtDateTime, fmtTime, money, SERVICE_NAME, STATUS_LABEL } from "@/lib/format";
import type { Tracked } from "@/lib/types";
import { RouteMap } from "./RouteMap";

const STEPS: [string, string][] = [["booked", "Booked"], ["assigned", "Driver assigned"], ["picked", "Picked up"], ["delivered", "Delivered"]];

// Public live tracking. Refreshes every 15 seconds while the delivery is active.
export function TrackLive({ token, initial }: { token: string; initial: Tracked }) {
  const [t, setT] = useState<Tracked>(initial);
  const active = t.status === "pending" || t.status === "assigned" || t.status === "picked";

  useEffect(() => {
    if (!active) return;
    const supabase = createClient();
    const id = setInterval(async () => {
      const { data } = await supabase.rpc("track_by_token", { p_token: token });
      if (data) setT(data as Tracked);
    }, 15000);
    return () => clearInterval(id);
  }, [active, token]);

  const driver = t.driver_lat != null && t.driver_lng != null ? { lat: t.driver_lat, lng: t.driver_lng } : null;
  const late = t.status === "delivered" && t.late_credit_cents > 0;
  const onTime = t.status === "delivered" && t.late_credit_cents === 0 && t.promised_at;

  return (
    <div className="trackpage">
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span className="mono">{t.waybill}</span>
        <span className={`pill st-${t.status}`}>{STATUS_LABEL[t.status]}</span>
        <span style={{ color: "var(--muted)", fontSize: 14 }}>{SERVICE_NAME[t.service]}</span>
      </div>
      <h1 className="route-t" style={{ marginTop: 10 }}>{t.pickup.name} to {t.dropoff.name}</h1>

      {active && t.promised_at && (
        <div className="eta">
          <div>
            <div className="lbl">Delivery promised by</div>
            <b>{fmtTime(t.promised_at)}</b>
          </div>
          <span className="pill st-picked">On-time guarantee</span>
        </div>
      )}
      {t.status === "delivered" && t.delivered_at && (
        <div className="eta">
          <div>
            <div className="lbl">Delivered</div>
            <b>{fmtDateTime(t.delivered_at)}</b>
          </div>
          {onTime && <span className="pill st-delivered">On time</span>}
          {late && <span className="pill st-open">Late, {money(t.late_credit_cents)} credited</span>}
        </div>
      )}

      {t.driver_first_name && (
        <div className="drivercard">
          <div className="avatar" aria-hidden="true">{t.driver_first_name[0]}</div>
          <div>
            <b>{t.driver_first_name}</b>
            <span>{t.driver_vehicle ?? "Agility driver"}{t.driver_pos_at && active ? ` · updated ${fmtTime(t.driver_pos_at)}` : ""}</span>
          </div>
        </div>
      )}

      <RouteMap a={{ ...t.pickup, label: t.pickup.name }} b={{ ...t.dropoff, label: t.dropoff.name }} driver={driver} />

      <h4 className="sect">Progress</h4>
      <ul className="tl">
        {STEPS.map(([k, label]) => {
          const e = t.events.find((x) => x.kind === k);
          return (
            <li key={k} className={e ? "on" : ""}>
              <b>{label}</b>
              <small>{e ? fmtDateTime(e.at) : "Not yet"}</small>
            </li>
          );
        })}
      </ul>

      {t.pod_photo && (
        <>
          <h4 className="sect">Proof of delivery</h4>
          {t.pod_name && <p>Received by <b>{t.pod_name}</b></p>}
          <div className="sig">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Photo of the delivered package" src={t.pod_photo} style={{ height: "auto", maxHeight: 360, width: "100%", objectFit: "contain" }} />
          </div>
        </>
      )}
    </div>
  );
}
