"use client";
import { useEffect, useRef } from "react";

// Placeholder stock media. To use your own, drop files in /public/media and change these constants.
const VIDEO = "https://assets.mixkit.co/videos/44621/44621-720.mp4";
const POSTER = "https://assets.mixkit.co/videos/44621/44621-thumb-720-0.jpg";
const PHOTOS = [
  { src: "https://images.unsplash.com/photo-1688619103602-35c5b27a6619?auto=format&fit=crop&w=900&q=70", alt: "White van driving along a curving road", cap: "Highway runs" },
  { src: "https://images.unsplash.com/photo-1755302731148-8f48773efb89?auto=format&fit=crop&w=900&q=70", alt: "White vans parked on a tree-lined city street", cap: "Van deliveries" },
  { src: "https://images.unsplash.com/photo-1768753025396-bace64edd60d?auto=format&fit=crop&w=900&q=70", alt: "Car driving through a city street at night", cap: "Urgent city runs" },
];

export function OnTheRoad() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    // Respect the device's reduced-motion setting: show the still frame instead of playing.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) ref.current?.pause();
  }, []);
  return (
    <section className="band onroad" id="road">
      <div className="wrap">
        <div className="reel">
          <video ref={ref} src={VIDEO} poster={POSTER} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
          <div className="reeltext">
            <h2>Always moving</h2>
            <p>Every job is run by an Agility driver, from pickup to signature.</p>
            <a className="btn amber" href="#quote">Price a shipment</a>
          </div>
        </div>
        <div className="photos">
          {PHOTOS.map((p) => (
            <figure key={p.cap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt={p.alt} loading="lazy" width={900} height={600} />
              <figcaption>{p.cap}</figcaption>
            </figure>
          ))}
        </div>
        <p className="credit">Placeholder media: photos from Unsplash, video from Mixkit.</p>
      </div>
    </section>
  );
}
