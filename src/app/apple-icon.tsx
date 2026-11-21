import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#FFB000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="110" height="110" viewBox="0 0 32 32"><path d="M7 23 L16 7 L25 23 L16 18.5 Z" fill="#0D1B2A" /></svg>
      </div>
    ),
    size,
  );
}
