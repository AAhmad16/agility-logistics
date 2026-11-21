"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { completeDelivery } from "@/app/actions";
import { money } from "@/lib/format";
import { SignaturePad } from "./SignaturePad";

// Shrinks a phone photo to a small JPEG so it uploads fast on cellular.
async function shrinkPhoto(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.7);
}

export function DeliveryForm({ id, recipientPlace, payoutCents }: { id: string; recipientPlace: string; payoutCents: number }) {
  const [name, setName] = useState("");
  const [sig, setSig] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const onSig = useCallback((s: string | null) => setSig(s), []);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      setPhoto(await shrinkPhoto(file));
    } catch {
      setError("That photo could not be read. Try taking it again.");
    }
  }

  async function submit() {
    if (!sig || !photo) return;
    setBusy(true);
    setError("");
    const res = await completeDelivery(id, name, sig, photo);
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
      <div>
        <div className="lbl" style={{ marginBottom: 6 }}>Photo of the delivered package</div>
        {photo ? (
          <div className="photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Delivered package" />
            <button type="button" className="btn ghost sm" onClick={() => setPhoto(null)}>Retake</button>
          </div>
        ) : (
          <label className="btn dark block photo-btn">
            Take photo
            <input type="file" accept="image/*" capture="environment" onChange={onPhoto} hidden />
          </label>
        )}
      </div>
      <div className="field">
        <label htmlFor="pname">Recipient name</label>
        <input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoComplete="off" />
      </div>
      <div>
        <div className="lbl" style={{ marginBottom: 6 }}>Signature</div>
        <SignaturePad onChange={onSig} />
      </div>
      {error && <div className="alert err" role="alert">{error}</div>}
      <button className="btn amber block" disabled={busy || !name.trim() || !sig || !photo} onClick={submit}>
        {busy ? "Saving…" : "Complete delivery"}
      </button>
    </div>
  );
}
