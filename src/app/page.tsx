import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Loc, Rate } from "@/lib/types";
import { DISPATCH_PHONE, LATE_CREDIT_PCT, money, phoneHref } from "@/lib/format";
import { submitQuoteRequest } from "./actions";
import { QuoteCard } from "@/components/QuoteCard";
import { TrackBox } from "@/components/TrackBox";
import { RouteMap } from "@/components/RouteMap";
import { OnTheRoad } from "@/components/OnTheRoad";
import { RoadScene } from "@/components/RoadScene";
import { SiteNav } from "@/components/SiteNav";
import { DispatchLine } from "@/components/DispatchLine";
import { CategoryIcon, ServiceArt, type CategoryKind } from "@/components/ServiceArt";

export default async function Home({ searchParams }: { searchParams: Promise<{ sent?: string; qerror?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const [{ data: hubs }, { data: rates }] = await Promise.all([
    supabase.from("locations").select("*").eq("is_hub", true).order("name"),
    supabase.from("service_rates").select("*").order("base_cents"),
  ]);
  const locations = (hubs ?? []) as Loc[];
  const services = (rates ?? []) as Rate[];
  const hq = locations.find((l) => l.name === "Schaumburg HQ");
  const loop = locations.find((l) => l.name === "Chicago Loop");
  const WHO: Record<string, string> = {
    sprint: "Aircraft-on-ground parts, tooling, urgent documents",
    sameday: "Replenishment, samples, production line shortages",
    nfo: "Parts and documents that have to make the next flight",
    stat: "Lab specimens, devices, time-sensitive medical supplies",
  };

  const CATEGORIES: { kind: CategoryKind; title: string; items: string[] }[] = [
    { kind: "aviation", title: "Aviation and industrial", items: ["Aircraft-on-ground parts", "Tooling and fixtures", "Machine and equipment parts", "Test equipment"] },
    { kind: "medical", title: "Medical and lab", items: ["Lab specimens", "Devices and instruments", "Time-sensitive supplies", "Paperwork that travels with them"] },
    { kind: "documents", title: "Documents and legal", items: ["Contracts and filings", "Signed originals", "Sealed envelopes", "Court and permit packets"] },
    { kind: "production", title: "Production and retail", items: ["Line-down shortages", "Samples and prototypes", "Store replenishment", "Rush orders for customers"] },
  ];
  const FAQ: [string, string][] = [
    ["How do I get a price?", "Use the quote box at the top of this page. Pick the pickup, the delivery, the service and the weight, and the price appears right away. It is the price you pay."],
    ["How fast will it arrive?", "Each service shows its delivery window, and every booking gets a promised delivery time that you and your recipient can see."],
    ["What if the driver is late?", `The ${LATE_CREDIT_PCT}% credit comes off your invoice automatically. There is nothing to file.`],
    ["What can I send?", "Parts, documents, specimens and other packages up to 150 lb. If something is unusual, call dispatch before you book."],
    ["Where do you deliver?", "Across Chicagoland. The booking form lists our hubs, including Schaumburg, O'Hare, Chicago Loop, Midway, Naperville, Elgin, Gurnee and Joliet. For another address, call or text dispatch."],
    ["Do I need an account to book?", "Prices are open to everyone. To book, create a free client account. You are invoiced after each delivery on net 15 terms and can pay online."],
    ["Can the person receiving it follow the delivery?", "Yes. Send them the tracking link from your shipment page. They see the driver on a map and the promised time, with no login."],
  ];

  return (
    <>
      <SiteNav />

      <section className="hero">
        <div className="wrap grid">
          <div>
            <h1>When it has to be there today.</h1>
            <p className="sub">Our own drivers, a live map and one invoice. For parts, documents and specimens that cannot wait for tomorrow.</p>
            <p className="guarantee"><b>On-time guarantee.</b> Late? {LATE_CREDIT_PCT}% comes off your invoice automatically. The price you see is the price you pay.</p>
            <div className="cta">
              <a className="btn amber" href="#quote">Price a shipment</a>
              <Link className="btn ghost" style={{ color: "#fff" }} href="/signup">Open a client account</Link>
            </div>
            {hq && loop && (
              <div style={{ marginTop: 28, borderRadius: 14, overflow: "hidden", border: "1px solid #223A52" }}>
                <RouteMap dark a={{ lat: hq.lat, lng: hq.lng, label: hq.name }} b={{ lat: loop.lat, lng: loop.lng, label: loop.name }} others={locations} />
              </div>
            )}
          </div>
          <QuoteCard locations={locations} rates={services} />
        </div>
      </section>

      <RoadScene />

      <TrackBox />

      <section className="band" id="services">
        <div className="wrap">
          <h2 className="sec">Four ways to move something fast</h2>
          <p className="intro">Every job is run by an Agility driver. You choose how fast, and we price it before you book.</p>
          <div className="cards">
            {services.map((s) => (
              <article className="card" key={s.service}>
                <ServiceArt kind={s.service} />
                <div className="cbody">
                  <h3>{s.name}</h3>
                  <div className="win">{s.window_text}</div>
                  <p>{s.description}. {WHO[s.service]}.</p>
                  <div className="cfoot">
                    <span className="from">from <b>{money(s.base_cents).replace(".00", "")}</b></span>
                    <a className="btn dark sm" href="#quote">Get a price</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <OnTheRoad />

      <section className="band" id="deliver" style={{ background: "#fff" }}>
        <div className="wrap">
          <h2 className="sec">What we carry</h2>
          <p className="intro">If it is small enough for one driver and cannot wait, we can move it.</p>
          <div className="deliver">
            {CATEGORIES.map((c) => (
              <div key={c.title}>
                <CategoryIcon kind={c.kind} />
                <h4>{c.title}</h4>
                <ul>{c.items.map((i) => <li key={i}>{i}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band" id="why">
        <div className="wrap">
          <h2 className="sec">Why shippers switch to Agility</h2>
          <div className="why">
            <div><h4>On-time guarantee</h4><p>Every booking has a promised delivery time. Miss it and {LATE_CREDIT_PCT}% comes off the invoice, with no claim form.</p></div>
            <div><h4>The price you see is the price you pay</h4><p>Quotes are instant and firm. No sales call, no fuel surcharge added later.</p></div>
            <div><h4>Our own drivers, by name</h4><p>You see your driver&apos;s name and vehicle before they arrive. No anonymous network.</p></div>
            <div><h4>Proof you can see</h4><p>A photo of the delivered package, the recipient&apos;s signature and the time, on one page.</p></div>
            <div><h4>Live link for the recipient</h4><p>Text a tracking link to whoever is waiting. They follow the driver on a map, no login.</p></div>
            <div><h4>A real person on dispatch</h4><p>Call or text a dispatcher in Schaumburg who answers in minutes.{" "}<DispatchLine /></p></div>
          </div>
        </div>
      </section>

      <section className="band" id="how" style={{ background: "#fff" }}>
        <div className="wrap">
          <h2 className="sec">From booking to signature</h2>
          <ol className="steps">
            <li><h4>Book</h4><p>Choose the route and service. The price shows before you confirm.</p></li>
            <li><h4>Dispatch</h4><p>The job goes to a driver, who accepts it in the app.</p></li>
            <li><h4>Follow</h4><p>Watch the driver on the map as the job moves.</p></li>
            <li><h4>Sign and bill</h4><p>The recipient signs on the phone. The invoice is ready right away.</p></li>
          </ol>
        </div>
      </section>

      <section className="band" id="faq">
        <div className="wrap faqwrap">
          <h2 className="sec">Questions shippers ask</h2>
          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="band contact" id="contact">
        <div className="wrap contactgrid">
          <div>
            <h2 className="sec">Talk to dispatch</h2>
            <p className="intro">Tell us what you need to move and where. A person will get back to you.</p>
            {DISPATCH_PHONE && (
              <div className="phoneblock">
                <div className="lbl">Call or text</div>
                <a className="bigphone" href={`tel:${phoneHref(DISPATCH_PHONE)}`}>{DISPATCH_PHONE}</a>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                  <a className="btn amber" href={`tel:${phoneHref(DISPATCH_PHONE)}`}>Call dispatch</a>
                  <a className="btn ghost" href={`sms:${phoneHref(DISPATCH_PHONE)}`}>Send a text</a>
                </div>
              </div>
            )}
            <p className="hint" style={{ marginTop: 18 }}>Agility Logistics · Schaumburg, Illinois</p>
            <p className="hint">Existing clients and drivers: <Link href="/login" style={{ color: "var(--teal)", fontWeight: 600 }}>sign in</Link>.</p>
          </div>
          <form className="quoteform" action={submitQuoteRequest}>
            <h3>Request a quote</h3>
            {sp.sent && <div className="alert ok" role="status">Thanks. We received your request and will get back to you.</div>}
            {sp.qerror && <div className="alert err" role="alert">{sp.qerror}</div>}
            <div className="field"><label htmlFor="qf-name">Your name</label><input id="qf-name" name="name" autoComplete="name" required maxLength={120} /></div>
            <div className="field"><label htmlFor="qf-company">Company</label><input id="qf-company" name="company" autoComplete="organization" maxLength={160} /></div>
            <div className="two">
              <div className="field"><label htmlFor="qf-email">Email</label><input id="qf-email" name="email" type="email" autoComplete="email" maxLength={200} /></div>
              <div className="field"><label htmlFor="qf-phone">Phone</label><input id="qf-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} /></div>
            </div>
            <div className="field"><label htmlFor="qf-msg">What do you need to move?</label><textarea id="qf-msg" name="message" rows={4} maxLength={1500} placeholder="Pickup, delivery, how fast, how often" /></div>
            <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <p className="hint" style={{ margin: "0 0 10px" }}>Add an email or a phone number so we can reach you.</p>
            <button className="btn amber block">Send request</button>
          </form>
        </div>
      </section>

      <footer className="site">
        <div className="wrap"><span>Agility Logistics · Schaumburg, Illinois</span><span><DispatchLine /> Drivers: ask dispatch for an invite</span></div>
      </footer>
    </>
  );
}
