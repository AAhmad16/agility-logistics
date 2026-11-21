type Pt = { lat: number; lng: number; label?: string };

// Schematic route map. Projects real coordinates onto a 100x72 canvas.
// Swap for Mapbox or Google Maps later without touching the pages that use it.
export function RouteMap({
  a,
  b,
  driver,
  dark,
  others = [],
  caption = true,
}: {
  a: Pt;
  b: Pt;
  driver?: { lat: number; lng: number } | null;
  dark?: boolean;
  others?: Pt[];
  caption?: boolean;
}) {
  const lat0 = ((a.lat + b.lat) / 2) * (Math.PI / 180);
  const px = (p: { lat: number; lng: number }) => ({ x: p.lng * Math.cos(lat0), y: -p.lat });
  const pts = [a, b, ...(driver ? [driver] : [])].map(px);
  const minX = Math.min(...pts.map((p) => p.x)), maxX = Math.max(...pts.map((p) => p.x));
  const minY = Math.min(...pts.map((p) => p.y)), maxY = Math.max(...pts.map((p) => p.y));
  let w = Math.max(maxX - minX, 0.12) * 1.6, h = Math.max(maxY - minY, 0.12) * 1.6;
  if (w / h < 100 / 72) w = h * (100 / 72);
  else h = w * (72 / 100);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const s = 100 / w;
  const to = (p: { lat: number; lng: number }) => {
    const q = px(p);
    return { x: 50 + (q.x - cx) * s, y: 36 + (q.y - cy) * s };
  };
  const A = to(a), B = to(b);
  const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1;
  const C = { x: (A.x + B.x) / 2 - (dy / len) * 5, y: (A.y + B.y) / 2 + (dx / len) * 5 };
  const D = driver ? to(driver) : null;
  const label = (p: { x: number; y: number }, text: string) => (
    <text x={p.x + (p.x < 70 ? 2.6 : -2.6)} y={p.y + 0.9} textAnchor={p.x < 70 ? "start" : "end"}>
      {text}
    </text>
  );
  return (
    <svg
      className={`map${dark ? " dark" : ""}`}
      viewBox="0 0 100 72"
      role="img"
      aria-label={`Schematic route from ${a.label ?? "pickup"} to ${b.label ?? "delivery"}`}
    >
      <rect className="bg" width="100" height="72" />
      {others.map((o, i) => {
        const p = to(o);
        return p.x > 0 && p.x < 100 && p.y > 0 && p.y < 72 ? <circle key={i} className="node" cx={p.x} cy={p.y} r=".8" /> : null;
      })}
      <path className="route" d={`M${A.x} ${A.y} Q${C.x} ${C.y} ${B.x} ${B.y}`} />
      <circle className="end-a" cx={A.x} cy={A.y} r="1.7" />
      <circle className="end-b" cx={B.x} cy={B.y} r="1.7" />
      {a.label && label(A, a.label)}
      {b.label && label(B, b.label)}
      {D && (
        <g transform={`translate(${D.x.toFixed(2)} ${D.y.toFixed(2)})`}>
          <circle r="2" fill="none" stroke="#FFB000" strokeWidth=".5">
            <animate attributeName="r" values="2;5.5" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values=".9;0" dur="1.6s" repeatCount="indefinite" />
          </circle>
          <circle r="1.7" fill="#FFB000" stroke="#0D1B2A" strokeWidth=".55" />
        </g>
      )}
      {caption && (
        <text x="98" y="70" textAnchor="end" style={{ fontSize: "2.2px", fontWeight: 500 }}>
          Schematic map
        </text>
      )}
    </svg>
  );
}
