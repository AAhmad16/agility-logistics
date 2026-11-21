import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#FFB000", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 112 }}>
        <svg width="300" height="300" viewBox="0 0 32 32"><path d="M7 23 L16 7 L25 23 L16 18.5 Z" fill="#0D1B2A" /></svg>
      </div>
    ),
    size,
  );
}
