import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tracked } from "@/lib/types";
import { LogoMark } from "@/components/Logo";
import { DispatchLine } from "@/components/DispatchLine";
import { TrackLive } from "@/components/TrackLive";

export const metadata = { title: "Track your delivery", robots: { index: false, follow: false } };

export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("track_by_token", { p_token: token });
  if (!data) notFound();
  return (
    <>
      <header className="sitenav">
        <div className="wrap nav">
          <Link className="logo" href="/"><LogoMark /><span>Agility Logistics<small>Time-critical delivery</small></span></Link>
          <div className="links"><DispatchLine /></div>
        </div>
      </header>
      <main className="wrap" style={{ padding: "24px 20px 64px", maxWidth: 720 }}>
        <TrackLive token={token} initial={data as Tracked} />
      </main>
    </>
  );
}
