import { requireRole } from "@/lib/session";
import { NavLink } from "@/components/NavLink";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  await requireRole("driver");
  return (
    <div className="driver-shell">
      {children}
      <nav className="ptabs" aria-label="Driver app">
        <NavLink href="/driver" exact>Jobs</NavLink>
        <NavLink href="/driver/earnings">Earnings</NavLink>
      </nav>
    </div>
  );
}
