import Link from "next/link";
import { getSession, homeFor } from "@/lib/session";
import { LogoMark } from "@/components/Logo";

export async function SiteNav() {
  const session = await getSession();
  return (
    <header className="sitenav">
      <div className="wrap nav">
        <Link className="logo" href="/">
          <LogoMark />
          <span>Agility Logistics<small>Time-critical delivery</small></span>
        </Link>
        <div className="links">
          <Link className="lnk" href="/">Home</Link>
          <Link className="lnk hide-s" href="/#services">Services</Link>
          <Link className="lnk" href="/blog">Blog</Link>
          <Link className="lnk hide-s" href="/#track">Track</Link>
          <Link className="lnk hide-s" href="/#contact">Contact</Link>
          {session ? (
            <Link className="btn amber sm" href={homeFor(session.profile.role)}>Open dashboard</Link>
          ) : (
            <>
              <Link className="lnk hide-s" href="/login">Sign in</Link>
              <Link className="btn amber sm" href="/signup">Create account</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
