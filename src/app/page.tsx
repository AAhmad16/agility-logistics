import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSession, homeFor } from "@/lib/session";
import type { Loc, Rate } from "@/lib/types";
import { money } from "@/lib/format";
import { LogoMark } from "@/components/Logo";
import { QuoteCard } from "@/components/QuoteCard";
import { TrackBox } from "@/components/TrackBox";
import { RouteMap } from "@/components/RouteMap";

export default async function Home() {
  const supabase = await createClient();
  const [{ data: hubs }, { data: rates }, session] = await Promise.all([
    supabase.from("locations").select("*").eq("is_hub", true).order("name"),
    supabase.from("service_rates").select("*").order("base_cents"),
    getSession(),
  ]);
  const locations = (hubs ?? []) as Loc[];
  const services = (rates ?? []) as Rate[];
  const hq = locations.find((l) => l.name === "Schaumburg HQ");
  const loop = locations.find((l) => l.name === "Chicago Loop");
  const WHO: Record<string, string> = {
    sprint: "Aircraft-on-ground parts, tooling, urgent documents",
    sameday: "Replenishment, samples, production line shortages",
    nfo: "Cross-country parts and documents that cannot wait for freight",
    stat: "Lab specimens, devices, time-sensitive medical supplies",
  };

  return (
    <>
      <header className="sitenav">
        <div className="wrap nav">
          <Link className="logo" href="/">
            <LogoMark />
            <span>Agility Logistics<small>Time-critical delivery</small></span>
          </Link>
          <div className="links">
            <a className="lnk hide-s" href="#services">Services</a>
            <a className="lnk" href="#track">Track</a>
            {session ? (
              <Link className="btn amber sm" href={homeFor(session.profile.role)}>Open dashboard</Link>
            ) : (
              <>
                <Link className="lnk" href="/login">Sign in</Link>
                <Link className="btn amber sm" href="/signup">Create account</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="wrap grid">
          <div>
            <h1>When it has to be there today.</h1>
            <p className="sub">Our own drivers, a live map and one invoice. For parts, documents and specimens that cannot wait for tomorrow.</p>
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

      <TrackBox />

      <section className="band" id="services">
        <div className="wrap">
          <h2 className="sec">Four ways to move something fast</h2>
          <p className="intro">Every job is run by an Agility driver. You choose how fast, and we price it before you book.</p>
          <div className="svclist">
            {services.map((s) => (
              <div className="svcrow" key={s.service}>
                <div><h3>{s.name}</h3><div className="win">{s.window_text}</div></div>
                <div>{s.description}. {WHO[s.service]}.</div>
                <div className="from">from<b>{money(s.base_cents).replace(".00", "")}</b></div>
              </div>
            ))}
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

      <footer className="site">
        <div className="wrap"><span>Agility Logistics · Schaumburg, Illinois</span><span>Drivers: ask dispatch for an invite</span></div>
      </footer>
    </>
  );
}
