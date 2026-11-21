"use client";
import { useEffect, useRef } from "react";

// Placeholder stock media. To use your own, drop files in /public/media and change these constants.
const VIDEO = "https://videos.pexels.com/video-files/17899033/17899033-hd_1920_1080_24fps.mp4";
const POSTER = "https://images.pexels.com/videos/17899033/pexels-photo-17899033.jpeg?auto=compress&cs=tinysrgb&h=627&fit=crop&w=1200";
const PHOTOS = [
  { src: "https://images.unsplash.com/photo-1734903251828-b8d4c0423e56?auto=format&fit=crop&w=900&q=70", alt: "Truck driving along a road beside a hill", cap: "Highway runs" },
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
        <p className="credit">Placeholder media: photos from Unsplash, video from Pexels.</p>
      </div>
    </section>
  );
}
