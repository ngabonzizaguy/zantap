"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

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
 * Two overlapping <video> elements crossfade near the loop point for a
 * seamless continuous feel. Under prefers-reduced-motion or Save-Data the
 * video is never requested.
 */
export function HeroMedia() {
  const skipVideo = useSyncExternalStore(
    subscribeReducedMotion,
    shouldSkipVideo,
    () => true,
  );
  const playVideo = !skipVideo;
  const [videoReady, setVideoReady] = useState(false);

  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const [activeSlot, setActiveSlot] = useState<"a" | "b">("a");

  useEffect(() => {
    if (!playVideo) return;
    const vA = videoARef.current;
    const vB = videoBRef.current;
    if (!vA || !vB) return;

    const CROSSFADE_OFFSET = 0.8;

    function handleTimeUpdate(this: HTMLVideoElement) {
      if (this.duration && this.currentTime >= this.duration - CROSSFADE_OFFSET) {
        const next = this === vA ? vB : vA;
        if (!next) return;
        next.currentTime = 0;
        next.play().catch(() => {});
        setActiveSlot(next === vA ? "a" : "b");
      }
    }

    vA.addEventListener("timeupdate", handleTimeUpdate);
    vB.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      vA.removeEventListener("timeupdate", handleTimeUpdate);
      vB.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [playVideo]);

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
      {playVideo && (
        <>
          <video
            ref={videoARef}
            autoPlay
            muted
            playsInline
            preload="auto"
            onCanPlay={() => setVideoReady(true)}
            className={`absolute inset-0 h-full w-full object-cover object-[70%_center] transition-opacity duration-[800ms] ${videoReady && activeSlot === "a" ? "opacity-100" : "opacity-0"}`}
          >
            <source src={HERO_LOOP} type="video/mp4" />
          </video>
          <video
            ref={videoBRef}
            muted
            playsInline
            preload="auto"
            className={`absolute inset-0 h-full w-full object-cover object-[70%_center] transition-opacity duration-[800ms] ${videoReady && activeSlot === "b" ? "opacity-100" : "opacity-0"}`}
          >
            <source src={HERO_LOOP} type="video/mp4" />
          </video>
        </>
      )}
      {/* Veil: keeps left copy + form legible over the footage */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0c0a09]/95 via-[#0c0a09]/72 to-[#0c0a09]/35" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0c0a09] to-transparent" />
    </div>
  );
}
