"use client";

import { useState } from "react";

// Lets a client send the live tracking link to the recipient: copy it, or open Messages with the link filled in.
export function ShareLink({ token, waybill }: { token: string; waybill: string }) {
  const [copied, setCopied] = useState(false);
  const url = () => `${window.location.origin}/track/${token}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url());
    }
  }
  function text() {
    window.location.href = `sms:?&body=${encodeURIComponent(`Track delivery ${waybill} live: ${url()}`)}`;
  }
  return (
    <div className="share">
      <p className="hint" style={{ margin: "0 0 8px" }}>Anyone with this link can follow the driver live. No login needed.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn dark sm" onClick={text}>Text the link</button>
        <button type="button" className="btn ghost sm" onClick={copy}>{copied ? "Copied" : "Copy link"}</button>
      </div>
    </div>
  );
}
