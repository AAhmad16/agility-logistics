"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { completeDelivery } from "@/app/actions";
import { money } from "@/lib/format";
import { SignaturePad } from "./SignaturePad";

export function DeliveryForm({ id, recipientPlace, payoutCents }: { id: string; recipientPlace: string; payoutCents: number }) {
  const [name, setName] = useState("");
  const [sig, setSig] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const onSig = useCallback((s: string | null) => setSig(s), []);

  async function submit() {
    if (!sig) return;
    setBusy(true);
    setError("");
    const res = await completeDelivery(id, name, sig);
    setBusy(false);
    if ("error" in res && res.error) setError(res.error);
    else setDone(res.invoice ?? "");
  }

  if (done !== null)
    return (
      <div className="done">
        <div className="ck">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </div>
        <h3>Delivered</h3>
        <p style={{ color: "var(--muted)", margin: "6px 0 18px" }}>Signed by {name}</p>
        <div className="earn" style={{ marginBottom: 18 }}>
          <div><b>{money(payoutCents)}</b><span>earned on this job</span></div>
          <div><b style={{ fontSize: 18 }}>{done}</b><span>invoice sent to client</span></div>
        </div>
        <Link className="btn dark block" href="/driver">Back to jobs</Link>
      </div>
    );

  return (
    <div className="stack">
      <p className="hint">Delivering to {recipientPlace}</p>
      <div className="field">
        <label htmlFor="pname">Recipient name</label>
        <input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoComplete="off" />
      </div>
      <div>
        <div className="lbl" style={{ marginBottom: 6 }}>Signature</div>
        <SignaturePad onChange={onSig} />
      </div>
      {error && <div className="alert err" role="alert">{error}</div>}
      <button className="btn amber block" disabled={busy || !name.trim() || !sig} onClick={submit}>
        {busy ? "Saving…" : "Complete delivery"}
      </button>
    </div>
  );
}
