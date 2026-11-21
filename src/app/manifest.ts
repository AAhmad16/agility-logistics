import type { MetadataRoute } from "next";

// Lets drivers install the app on an iPhone: Safari > Share > Add to Home Screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agility Driver",
    short_name: "Agility",
    description: "Jobs, navigation and proof of delivery for Agility drivers.",
    start_url: "/driver",
    scope: "/",
    display: "standalone",
    background_color: "#0D1B2A",
    theme_color: "#0D1B2A",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png" }],
  };
}
