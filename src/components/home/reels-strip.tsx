"use client";

import { useEffect, useRef, useState } from "react";

export interface Reel {
  url: string;
  caption?: string;
}

/**
 * Instagram-style clips that play muted and on loop, but only while they are
 * on screen: the file isn't even requested until a tile scrolls near, and a
 * tile that leaves the screen pauses. Tapping a clip turns its sound on (and
 * every other clip's off).
 */
function ReelTile({
  reel,
  soundOn,
  onToggleSound,
  reducedMotion,
}: {
  reel: Reel;
  soundOn: boolean;
  onToggleSound: () => void;
  reducedMotion: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const [near, setNear] = useState(false);
  // Whether the tile is on screen right now; the clip may only become
  // playable after that, so onCanPlay checks it too.
  const visible = useRef(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const loadObserver = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          loadObserver.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    const playObserver = new IntersectionObserver(
      ([e]) => {
        visible.current = e.intersectionRatio >= 0.6;
        if (visible.current && !reducedMotion) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: [0, 0.6] }
    );
    loadObserver.observe(video);
    playObserver.observe(video);
    return () => {
      loadObserver.disconnect();
      playObserver.disconnect();
    };
  }, [reducedMotion]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !soundOn;
    if (soundOn) video.play().catch(() => {});
  }, [soundOn]);

  return (
    <button
      type="button"
      onClick={onToggleSound}
      aria-label={soundOn ? "Выключить звук" : "Включить звук"}
      className="group relative block aspect-[9/16] w-[62vw] max-w-64 shrink-0 snap-start overflow-hidden rounded-[1.75rem] bg-navy/90 text-left shadow-lg shadow-navy/10 sm:w-56 lg:max-w-none"
    >
      <video
        ref={videoRef}
        src={near ? reel.url : undefined}
        muted
        loop
        playsInline
        preload="metadata"
        onCanPlay={(e) => {
          if (visible.current && !reducedMotion && e.currentTarget.paused) e.currentTarget.play().catch(() => {});
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (barRef.current && v.duration) barRef.current.style.width = `${(v.currentTime / v.duration) * 100}%`;
        }}
        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
      />
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/70 to-transparent" />

      {/* Sound state */}
      <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition group-hover:bg-black/55">
        <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden>
          <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
          {soundOn ? (
            <path d="M16 9a4 4 0 0 1 0 6m2.5-8.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          ) : (
            <path d="m16 9.5 5 5m0-5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          )}
        </svg>
      </span>

      {!playing && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/85 text-navy shadow-lg">
            <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6" aria-hidden>
              <path d="M8 5v14l11-7L8 5Z" fill="currentColor" />
            </svg>
          </span>
        </span>
      )}

      {reel.caption && (
        <span className="absolute inset-x-4 bottom-5 line-clamp-2 text-sm font-semibold leading-snug text-white drop-shadow">
          {reel.caption}
        </span>
      )}
      <span className="absolute inset-x-4 bottom-2.5 h-0.5 overflow-hidden rounded-full bg-white/25">
        <span ref={barRef} className="block h-full w-0 bg-white" />
      </span>
    </button>
  );
}

export function ReelsStrip({ reels }: { reels: Reel[] }) {
  const [soundIndex, setSoundIndex] = useState<number | null>(null);
  const [reducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  return (
    // Up to five fill one row on desktop; more become a scrolling strip with
    // the next clip peeking in, as they always are on phones.
    <div
      className={`no-scrollbar -mx-6 flex snap-x gap-3 overflow-x-auto px-6 pb-2 ${
        reels.length <= 5 ? "lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0 lg:[&>*]:w-auto" : "lg:[&>*]:w-[calc((100%-3rem)/4.6)]"
      }`}
    >
      {reels.slice(0, 10).map((reel, i) => (
        <ReelTile
          key={reel.url}
          reel={reel}
          soundOn={soundIndex === i}
          reducedMotion={reducedMotion}
          onToggleSound={() => setSoundIndex((cur) => (cur === i ? null : i))}
        />
      ))}
    </div>
  );
}
