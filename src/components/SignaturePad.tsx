"use client";

import { useEffect, useRef } from "react";

export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const clearRef = useRef<() => void>(() => {});

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0D1B2A";
    let drawing = false;
    let last = { x: 0, y: 0 };
    let inked = false;
    const pt = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      return { x: ((e.clientX - r.left) * c.width) / r.width, y: ((e.clientY - r.top) * c.height) / r.height };
    };
    const down = (e: PointerEvent) => {
      drawing = true;
      last = pt(e);
      c.setPointerCapture(e.pointerId);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(last.x + 0.1, last.y + 0.1);
      ctx.stroke();
      e.preventDefault();
    };
    const move = (e: PointerEvent) => {
      if (!drawing) return;
      const p = pt(e);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
      inked = true;
      e.preventDefault();
    };
    const up = () => {
      if (!drawing) return;
      drawing = false;
      if (inked) onChange(c.toDataURL("image/png"));
    };
    c.addEventListener("pointerdown", down);
    c.addEventListener("pointermove", move);
    c.addEventListener("pointerup", up);
    c.addEventListener("pointercancel", up);
    clearRef.current = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      inked = false;
      onChange(null);
    };
    return () => {
      c.removeEventListener("pointerdown", down);
      c.removeEventListener("pointermove", move);
      c.removeEventListener("pointerup", up);
      c.removeEventListener("pointercancel", up);
    };
  }, [onChange]);

  return (
    <>
      <canvas ref={ref} className="sigpad" width={640} height={260} aria-label="Signature pad" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <span className="hint">Sign with your finger</span>
        <button type="button" className="btn ghost sm" onClick={() => clearRef.current()}>Clear</button>
      </div>
    </>
  );
}
