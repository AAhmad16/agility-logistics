"use client";

import { useState } from "react";
import type { Loc, Rate, ServiceLevel } from "@/lib/types";
import { etaText, money } from "@/lib/format";
import { useQuote } from "./useQuote";

export type Draft = { pickup: string; dropoff: string; service: ServiceLevel; weight: string };

// Route, service and weight fields with a live price. Used by the website quote card and the booking form.
export function ShipmentFields({
  locations,
  rates,
  initial,
  idPrefix,
  children,
}: {
  locations: Loc[];
  rates: Rate[];
  initial: Draft;
  idPrefix: string;
  children?: (state: { valid: boolean; price: string; draft: Draft }) => React.ReactNode;
}) {
  const [d, setD] = useState<Draft>(initial);
  const { quote } = useQuote(d.service, d.pickup, d.dropoff, d.weight);
  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));
  const same = d.pickup === d.dropoff;
  return (
    <>
      <div className="field">
        <label htmlFor={`${idPrefix}-pickup`}>Pickup</label>
        <select id={`${idPrefix}-pickup`} name="pickup" value={d.pickup} onChange={(e) => set({ pickup: e.target.value })}>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-dropoff`}>Delivery</label>
        <select id={`${idPrefix}-dropoff`} name="dropoff" value={d.dropoff} onChange={(e) => set({ dropoff: e.target.value })}>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>
      <div className="lbl" style={{ marginBottom: 6 }}>Service</div>
      <div className="svcgrid">
        {rates.map((r) => (
          <label className="svc" key={r.service}>
            <input type="radio" name="service" value={r.service} checked={d.service === r.service} onChange={() => set({ service: r.service })} />
            <b>{r.name}</b>
            <span>{r.description}</span>
          </label>
        ))}
      </div>
      <div className="field">
        <label htmlFor={`${idPrefix}-weight`}>Weight (lb)</label>
        <input id={`${idPrefix}-weight`} name="weight" type="number" min={1} max={150} step="0.1" required value={d.weight} onChange={(e) => set({ weight: e.target.value })} />
      </div>
      {children?.({
        valid: !!quote && !same,
        price: quote ? money(quote.price_cents) : "—",
        draft: d,
      })}
      <div className="qres">
        <div>
          <div className="lbl">Estimated price</div>
          <div className="big">{quote && !same ? money(quote.price_cents) : "—"}</div>
        </div>
        <div className="meta">
          {quote && !same && (
            <>
              <div>{quote.miles} miles</div>
              <div>Delivered in about {etaText(quote.eta_minutes)}</div>
            </>
          )}
        </div>
      </div>
      <div className="err" role="alert">{same ? "Choose two different locations." : ""}</div>
    </>
  );
}
