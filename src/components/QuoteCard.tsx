"use client";

import Link from "next/link";
import type { Loc, Rate } from "@/lib/types";
import { ShipmentFields } from "./ShipmentFields";

export function QuoteCard({ locations, rates }: { locations: Loc[]; rates: Rate[] }) {
  const find = (name: string) => locations.find((l) => l.name === name)?.id ?? locations[0]?.id ?? "";
  return (
    <div className="quote" id="quote">
      <h2>Price a shipment</h2>
      <p className="lead">Pick a route and a service level to see the price and delivery time.</p>
      <ShipmentFields
        locations={locations}
        rates={rates}
        idPrefix="q"
        initial={{ pickup: find("Schaumburg HQ"), dropoff: find("Chicago Loop"), service: "sameday", weight: "10" }}
      >
        {({ valid, draft }) => (
          <Link
            className={`btn dark block${valid ? "" : " disabled"}`}
            style={{ order: 99, marginBottom: 12, ...(valid ? {} : { opacity: 0.45, pointerEvents: "none" }) }}
            aria-disabled={!valid}
            href={`/portal/new?pickup=${draft.pickup}&dropoff=${draft.dropoff}&service=${draft.service}&weight=${encodeURIComponent(draft.weight)}`}
          >
            Book this shipment
          </Link>
        )}
      </ShipmentFields>
    </div>
  );
}
