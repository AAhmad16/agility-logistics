export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#FFB000" />
      <path d="M7 23 L16 7 L25 23 L16 18.5 Z" fill="#0D1B2A" />
    </svg>
  );
}
