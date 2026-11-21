// Decorative animated road scene. Pure CSS animation, no JavaScript, and it stops for people who ask for reduced motion.
function Wheel({ cx }: { cx: number }) {
  return (
    <g>
      <circle cx={cx} cy={50} r={9} fill="#0D1B2A" stroke="#E9EDF0" strokeWidth={3} />
      <g className="wheel" style={{ transformOrigin: `${cx}px 50px` }}>
        <line x1={cx - 6} y1={50} x2={cx + 6} y2={50} stroke="#9FB2C5" strokeWidth={2} />
        <line x1={cx} y1={44} x2={cx} y2={56} stroke="#9FB2C5" strokeWidth={2} />
      </g>
    </g>
  );
}

function Van() {
  return (
    <svg viewBox="0 0 120 62" width="120" aria-hidden="true">
      <rect x="4" y="12" width="74" height="34" rx="5" fill="#fff" />
      <path d="M78 20 h22 l14 16 v10 h-36 z" fill="#FFB000" />
      <path d="M84 25 h13 l9 11 h-22 z" fill="#0D1B2A" />
      <rect x="14" y="22" width="40" height="6" rx="3" fill="#0B7A75" />
      <rect x="112" y="40" width="5" height="5" rx="2" fill="#fff" />
      <Wheel cx={28} /><Wheel cx={96} />
    </svg>
  );
}

function BoxTruck() {
  return (
    <svg viewBox="0 0 150 62" width="150" aria-hidden="true">
      <rect x="2" y="4" width="98" height="42" rx="4" fill="#E9EDF0" />
      <rect x="2" y="30" width="98" height="6" fill="#FFB000" />
      <path d="M102 18 h26 l16 17 v11 h-42 z" fill="#0B7A75" />
      <path d="M108 23 h15 l10 12 h-25 z" fill="#0D1B2A" />
      <Wheel cx={26} /><Wheel cx={52} /><Wheel cx={122} />
    </svg>
  );
}

function Car() {
  return (
    <svg viewBox="0 0 100 52" width="100" aria-hidden="true">
      <path d="M6 38 v-8 q0-4 5-5 l14-2 l12-12 q3-3 7-3 h22 q5 0 8 3 l10 11 l10 2 q5 1 5 5 v9 z" fill="#C23B22" transform="translate(0,-2)" />
      <path d="M36 16 h26 l9 11 h-45 z" fill="#0D1B2A" opacity=".85" transform="translate(0,-2)" />
      <g transform="translate(0,-8)"><Wheel cx={24} /><Wheel cx={76} /></g>
    </svg>
  );
}

function Plane() {
  return (
    <svg viewBox="0 0 80 30" width="80" aria-hidden="true">
      <path d="M4 15 L32 12 L56 2 L62 2 L52 13 L74 14 L76 17 L52 18 L62 28 L56 28 L32 19 L4 17 Z" fill="#fff" />
      <path d="M32 12 L56 2 L62 2 L52 13 Z" fill="#FFB000" />
    </svg>
  );
}

function Skyline() {
  // Simple original skyline: blocks with a tall tower and an antenna.
  return (
    <svg className="skyline" viewBox="0 0 1200 110" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g fill="#14293F">
        <rect x="0" y="62" width="70" height="48" /><rect x="80" y="40" width="52" height="70" /><rect x="142" y="70" width="60" height="40" />
        <rect x="214" y="30" width="46" height="80" /><rect x="268" y="56" width="70" height="54" /><rect x="350" y="20" width="58" height="90" />
        <rect x="372" y="8" width="3" height="12" /><rect x="418" y="64" width="64" height="46" /><rect x="494" y="38" width="48" height="72" />
        <rect x="552" y="72" width="76" height="38" /><rect x="640" y="12" width="64" height="98" /><rect x="668" y="0" width="3" height="12" />
        <rect x="716" y="52" width="56" height="58" /><rect x="784" y="68" width="70" height="42" /><rect x="866" y="34" width="50" height="76" />
        <rect x="926" y="60" width="66" height="50" /><rect x="1004" y="24" width="56" height="86" /><rect x="1072" y="66" width="58" height="44" />
        <rect x="1140" y="44" width="60" height="66" />
      </g>
    </svg>
  );
}

export function RoadScene() {
  return (
    <section className="roadscene" aria-hidden="true">
      <Skyline />
      <div className="sky"><div className="v plane"><Plane /></div></div>
      <div className="road">
        <div className="v van"><Van /></div>
        <div className="v truck"><BoxTruck /></div>
        <div className="v car"><Car /></div>
        <div className="dash" />
      </div>
    </section>
  );
}
