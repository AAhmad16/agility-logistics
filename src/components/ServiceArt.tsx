import type { ServiceLevel } from "@/lib/types";

// Original illustrations for each service level. Swap for real photos by replacing this component.
export function ServiceArt({ kind }: { kind: ServiceLevel }) {
  return (
    <svg className="art" viewBox="0 0 320 180" role="img" aria-label={ART_LABEL[kind]}>
      <rect width="320" height="180" fill="#18304A" />
      {kind === "sprint" && (
        <>
          <g stroke="#FFB000" strokeWidth="5" strokeLinecap="round" opacity=".55">
            <line x1="30" y1="70" x2="78" y2="70" /><line x1="18" y1="100" x2="70" y2="100" /><line x1="34" y1="130" x2="80" y2="130" />
          </g>
          <circle cx="170" cy="100" r="52" fill="#0D1B2A" stroke="#fff" strokeWidth="6" />
          <rect x="159" y="34" width="22" height="12" rx="3" fill="#fff" />
          <g stroke="#9FB2C5" strokeWidth="3"><line x1="170" y1="58" x2="170" y2="66" /><line x1="170" y1="134" x2="170" y2="142" /><line x1="118" y1="100" x2="126" y2="100" /><line x1="214" y1="100" x2="222" y2="100" /></g>
          <line x1="170" y1="100" x2="170" y2="68" stroke="#FFB000" strokeWidth="6" strokeLinecap="round" />
          <line x1="170" y1="100" x2="192" y2="112" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
          <circle cx="170" cy="100" r="6" fill="#FFB000" />
        </>
      )}
      {kind === "sameday" && (
        <>
          <g stroke="#FFB000" strokeWidth="5" strokeLinecap="round" opacity=".55">
            <line x1="18" y1="84" x2="50" y2="84" /><line x1="10" y1="108" x2="46" y2="108" />
          </g>
          <rect x="62" y="64" width="136" height="66" rx="7" fill="#fff" />
          <path d="M198 80 h38 l24 28 v22 h-62 z" fill="#FFB000" />
          <path d="M206 88 h22 l16 20 h-38 z" fill="#0D1B2A" />
          <path d="M104 118 L124 84 L144 118 L124 110 Z" fill="#0D1B2A" />
          <circle cx="102" cy="134" r="15" fill="#0D1B2A" stroke="#fff" strokeWidth="5" />
          <circle cx="226" cy="134" r="15" fill="#0D1B2A" stroke="#fff" strokeWidth="5" />
          <rect x="0" y="156" width="320" height="4" fill="#223A52" />
          <g fill="#223A52"><rect x="30" y="166" width="30" height="4" /><rect x="110" y="166" width="30" height="4" /><rect x="190" y="166" width="30" height="4" /><rect x="270" y="166" width="30" height="4" /></g>
        </>
      )}
      {kind === "nfo" && (
        <>
          <g fill="#223A52"><rect x="0" y="150" width="320" height="30" /></g>
          <g fill="#9FB2C5"><rect x="20" y="162" width="30" height="4" /><rect x="90" y="162" width="30" height="4" /><rect x="160" y="162" width="30" height="4" /><rect x="230" y="162" width="30" height="4" /></g>
          <path d="M160 18 L172 66 L262 104 L262 118 L172 100 L168 142 L192 156 L192 166 L160 160 L128 166 L128 156 L152 142 L148 100 L58 118 L58 104 L148 66 Z" fill="#fff" />
          <path d="M160 18 L172 66 L148 66 Z" fill="#FFB000" />
          <rect x="146" y="76" width="28" height="6" rx="3" fill="#0D1B2A" opacity=".25" />
        </>
      )}
      {kind === "stat" && (
        <>
          <polyline points="14,52 78,52 92,30 110,76 126,44 140,52 306,52" fill="none" stroke="#FFB000" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity=".8" />
          <path d="M118 84 a14 14 0 0 1 14 -14 h56 a14 14 0 0 1 14 14" fill="none" stroke="#fff" strokeWidth="6" />
          <rect x="84" y="84" width="152" height="28" rx="9" fill="#FFB000" />
          <rect x="92" y="108" width="136" height="58" rx="10" fill="#fff" />
          <rect x="149" y="118" width="22" height="38" rx="3" fill="#0B7A75" />
          <rect x="141" y="126" width="38" height="22" rx="3" fill="#0B7A75" />
        </>
      )}
    </svg>
  );
}

const ART_LABEL: Record<ServiceLevel, string> = {
  sprint: "Stopwatch for urgent Sprint deliveries",
  sameday: "Delivery van for same-day deliveries",
  nfo: "Aircraft for Next Flight Out shipments",
  stat: "Medical cooler for STAT deliveries",
};

export type CategoryKind = "aviation" | "medical" | "documents" | "production";

// Small icons for the "What we deliver" grid.
export function CategoryIcon({ kind }: { kind: CategoryKind }) {
  const common = { width: 44, height: 44, viewBox: "0 0 44 44", "aria-hidden": true as const };
  return (
    <svg {...common}>
      <rect width="44" height="44" rx="11" fill="#0D1B2A" />
      {kind === "aviation" && <path d="M22 8 L25 18 L37 24 L37 27 L25 24 L24 32 L28 35 L28 37 L22 36 L16 37 L16 35 L20 32 L19 24 L7 27 L7 24 L19 18 Z" fill="#FFB000" />}
      {kind === "medical" && (<><rect x="19" y="9" width="6" height="26" rx="1.5" fill="#FFB000" /><rect x="9" y="19" width="26" height="6" rx="1.5" fill="#FFB000" /></>)}
      {kind === "documents" && (<><path d="M13 8 h13 l7 7 v21 h-20 z" fill="#FFB000" /><path d="M26 8 v7 h7" fill="none" stroke="#0D1B2A" strokeWidth="2" /><g stroke="#0D1B2A" strokeWidth="2.2" strokeLinecap="round"><line x1="17" y1="22" x2="29" y2="22" /><line x1="17" y1="27" x2="29" y2="27" /><line x1="17" y1="32" x2="25" y2="32" /></g></>)}
      {kind === "production" && (<><path d="M22 8 L36 15 V29 L22 36 L8 29 V15 Z" fill="#FFB000" /><path d="M8 15 L22 22 L36 15 M22 22 V36" fill="none" stroke="#0D1B2A" strokeWidth="2" /></>)}
    </svg>
  );
}
