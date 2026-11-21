import Link from "next/link";
import { requireRole } from "@/lib/session";
import { logout } from "../actions";
import { NavLink } from "@/components/NavLink";
import { LogoMark } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { DispatchLine } from "@/components/DispatchLine";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireRole("client");
  const supabase = await createClient();
  const { data: company } = await supabase.from("companies").select("name").eq("id", profile.company_id ?? "").maybeSingle();
  return (
    <div className="shell">
      <div className="portal">
        <aside>
          <Link className="logo" style={{ fontSize: 17, padding: "2px 4px" }} href="/">
            <LogoMark />
            <span>Agility</span>
          </Link>
          <div className="who">
            <b>{profile.full_name ?? "Client"}</b>
            {company?.name}
          </div>
          <nav className="navs" aria-label="Client portal">
            <NavLink href="/portal" exact>Shipments</NavLink>
            <NavLink href="/portal/new">New shipment</NavLink>
            <NavLink href="/portal/invoices">Invoices</NavLink>
          </nav>
          <DispatchLine className="dispatchline" />
          <form action={logout} style={{ marginTop: "auto" }}>
            <button className="btn ghost sm" style={{ color: "#C9D6E2", width: "100%" }}>Sign out</button>
          </form>
        </aside>
        <section className="pmain">{children}</section>
      </div>
    </div>
  );
}
