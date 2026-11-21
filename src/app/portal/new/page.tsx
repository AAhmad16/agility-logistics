import { createClient } from "@/lib/supabase/server";
import type { Loc, Rate, ServiceLevel } from "@/lib/types";
import { bookShipment } from "../../actions";
import { ShipmentFields } from "@/components/ShipmentFields";

export const metadata = { title: "New shipment" };

type SP = { pickup?: string; dropoff?: string; service?: string; weight?: string; error?: string };

export default async function NewShipment({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: locs }, { data: rates }] = await Promise.all([
    supabase.from("locations").select("*").order("is_hub", { ascending: false }).order("name"),
    supabase.from("service_rates").select("*").order("base_cents"),
  ]);
  const locations = (locs ?? []) as Loc[];
  const services = (rates ?? []) as Rate[];
  const has = (id?: string) => !!id && locations.some((l) => l.id === id);
  const find = (n: string) => locations.find((l) => l.name === n)?.id ?? locations[0]?.id ?? "";
  const service = (services.some((r) => r.service === sp.service) ? sp.service : "sameday") as ServiceLevel;
  return (
    <form action={bookShipment}>
      <div className="ptitle"><h2>New shipment</h2></div>
      {sp.error && <div className="alert err" role="alert">{sp.error}</div>}
      <div className="form">
        <div>
          <ShipmentFields
            locations={locations}
            rates={services}
            idPrefix="n"
            initial={{
              pickup: has(sp.pickup) ? sp.pickup! : find("Schaumburg HQ"),
              dropoff: has(sp.dropoff) ? sp.dropoff! : find("Chicago Loop"),
              service,
              weight: sp.weight && Number(sp.weight) > 0 ? sp.weight : "10",
            }}
          />
          <div className="field"><label htmlFor="reference">Reference or part number</label><input id="reference" name="reference" maxLength={200} placeholder="PO 88502 · bearing set" /></div>
          <div className="field"><label htmlFor="notes">Instructions for the driver</label><textarea id="notes" name="notes" rows={3} maxLength={1000} placeholder="Dock number, contact, special handling" /></div>
        </div>
        <div className="sticky">
          <div className="lbl">Ready to book?</div>
          <p className="hint" style={{ margin: "6px 0 12px" }}>The price shown is final. We invoice on net 15 terms after delivery.</p>
          <button className="btn amber block">Book shipment</button>
        </div>
      </div>
    </form>
  );
}
