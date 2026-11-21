import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Agility Logistics | Time-critical delivery", template: "%s | Agility Logistics" },
  description: "Our own drivers, a live map and one invoice, for parts, documents and specimens that cannot wait for tomorrow.",
  appleWebApp: { capable: true, title: "Agility Driver", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#0D1B2A", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,500..900&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
