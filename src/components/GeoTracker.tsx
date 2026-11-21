"use client";

import { useEffect, useState } from "react";
import { sendDriverPosition } from "@/app/actions";

// Shares the driver's position with the client while a job is active (every 15 seconds).
export function GeoTracker({ id }: { id: string }) {
  const [state, setState] = useState<"waiting" | "sharing" | "blocked">("waiting");
  const supported = typeof navigator !== "undefined" && "geolocation" in navigator;
  useEffect(() => {
    if (!supported) return;
    let last = 0;
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        setState("sharing");
        if (Date.now() - last > 15000) {
          last = Date.now();
          void sendDriverPosition(id, pos.coords.latitude, pos.coords.longitude);
        }
      },
      () => setState("blocked"),
      { enableHighAccuracy: true, maximumAge: 10000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [id, supported]);
  return (
    <p className="hint" role="status">
      {state === "sharing" && "Sharing your live location with the client."}
      {state === "waiting" && "Allow location access so the client can follow your delivery."}
      {(state === "blocked" || !supported) && "Location is off. The client will not see you on the map."}
    </p>
  );
}
