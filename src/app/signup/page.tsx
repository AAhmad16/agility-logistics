import Link from "next/link";
import { signup } from "../actions";
import { LogoMark } from "@/components/Logo";

export const metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="authwrap">
      <form className="authcard" action={signup}>
        <LogoMark size={40} />
        <h1 style={{ marginTop: 14 }}>Open a client account</h1>
        <p className="sub">Book shipments, follow drivers and pay invoices in one place.</p>
        {error && <div className="alert err" role="alert">{error}</div>}
        <div className="field"><label htmlFor="company_name">Company name</label><input id="company_name" name="company_name" autoComplete="organization" required /></div>
        <div className="field"><label htmlFor="full_name">Your name</label><input id="full_name" name="full_name" autoComplete="name" required /></div>
        <div className="field"><label htmlFor="email">Work email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
        <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required /></div>
        <button className="btn amber block">Create account</button>
        <p className="linkrow">Already have an account? <Link href="/login">Sign in</Link></p>
      </form>
    </div>
  );
}
