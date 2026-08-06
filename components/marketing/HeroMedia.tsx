"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";

const HERO_STILL = "/marketing/kigali-vendor-hero.png";
const HERO_LOOP = "/marketing/kigali-shift-loop.mp4";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void): () => void {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function shouldSkipVideo(): boolean {
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  return (
    window.matchMedia(REDUCED_MOTION_QUERY).matches ||
    connection?.saveData === true
  );
}

/**
 * Cinematic Kigali hero background (prototype A): the still paints
 * immediately (LCP), the muted 5s loop fades in over it once it can play.
 * Under prefers-reduced-motion or Save-Data the video is never requested
 * (server snapshot = skip, so SSR never ships the <video>).
 */
export function HeroMedia() {
  const skipVideo = useSyncExternalStore(
    subscribeReducedMotion,
    shouldSkipVideo,
    () => true
  );
  const playVideo = !skipVideo;
  const [videoReady, setVideoReady] = useState(false);

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <Image
        src={HERO_STILL}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[70%_center]"
      />
      {playVideo ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => setVideoReady(true)}
          className={`absolute inset-0 h-full w-full object-cover object-[70%_center] transition-opacity duration-1000 ${videoReady ? "opacity-100" : "opacity-0"}`}
        >
          <source src={HERO_LOOP} type="video/mp4" />
        </video>
      ) : null}
      {/* Veil: keeps left copy + form legible over the footage */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0c0a09]/95 via-[#0c0a09]/72 to-[#0c0a09]/35" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0c0a09] to-transparent" />
    </div>
  );
}
