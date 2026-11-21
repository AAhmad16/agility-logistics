import Link from "next/link";
import { login } from "../actions";
import { LogoMark } from "@/components/Logo";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string; next?: string }> }) {
  const { error, message, next } = await searchParams;
  return (
    <div className="authwrap">
      <form className="authcard" action={login}>
        <LogoMark size={40} />
        <h1 style={{ marginTop: 14 }}>Sign in</h1>
        <p className="sub">Clients, drivers and dispatch use the same login.</p>
        {error && <div className="alert err" role="alert">{error}</div>}
        {message && <div className="alert ok" role="status">{message}</div>}
        <input type="hidden" name="next" value={next ?? ""} />
        <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
        <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
        <button className="btn dark block">Sign in</button>
        <p className="linkrow">New client? <Link href="/signup">Create an account</Link> · <Link href="/">Back to site</Link></p>
      </form>
    </div>
  );
}
