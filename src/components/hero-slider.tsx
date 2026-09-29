"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { isLocalUpload } from "@/lib/image-src";

export interface HeroSlide {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  text: string;
  cta: { label: string; href: string };
  secondary?: { label: string; href: string };
}

const INTERVAL_MS = 6500;

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Reduced motion shortens every animation to ~0ms, which would turn the
  // progress-bar timer into a runaway loop — autoplay stays off instead.
  const [autoplay, setAutoplay] = useState(true);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setAutoplay(!media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  const count = slides.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count]
  );

  if (count === 0) return null;
  const slide = slides[index];

  return (
    <section
      className="relative isolate h-[min(88svh,780px)] min-h-[520px] overflow-hidden bg-ink text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStart.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
        touchStart.current = null;
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      aria-roledescription="carousel"
      aria-label="Главные предложения"
    >
      {slides.map((s, i) => (
        <div
          key={s.image + i}
          aria-hidden={i !== index}
          className={`absolute inset-0 -z-10 transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            key={i === index ? `active-${index}` : `idle-${i}`}
            className={`absolute inset-0 ${i === index ? "animate-kenburns" : ""}`}
          >
            <Image
              src={s.image}
              alt={s.alt}
              fill
              priority={i === 0}
              sizes="100vw"
              unoptimized={isLocalUpload(s.image)}
              className="object-cover"
            />
          </div>
        </div>
      ))}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/85 via-ink/55 to-ink/10" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-ink/70 to-transparent" />

      <div className="mx-auto flex h-full max-w-7xl flex-col justify-center px-6 pb-24 pt-10">
        <div key={index} className="max-w-2xl">
          <span className="eyebrow animate-fade-up text-cream [animation-delay:100ms]">
            {slide.eyebrow}
          </span>
          <h1 className="mt-5 animate-fade-up font-heading text-4xl font-bold leading-[1.08] tracking-tight [animation-delay:200ms] sm:text-5xl lg:text-6xl">
            {slide.title}
          </h1>
          <p className="mt-5 max-w-lg animate-fade-up text-base text-white/75 [animation-delay:320ms] sm:text-lg">
            {slide.text}
          </p>
          <div className="mt-9 flex animate-fade-up flex-wrap gap-3 [animation-delay:440ms]">
            <Link href={slide.cta.href} className="btn btn-light">
              {slide.cta.label}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            {slide.secondary && (
              <Link href={slide.secondary.href} className="btn btn-ghost-light">
                {slide.secondary.label}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Controls: numbered progress bars double as navigation */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto flex max-w-7xl items-end gap-3 px-6 pb-8">
          <div className="flex flex-1 gap-3">
            {slides.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Слайд ${i + 1}: ${s.eyebrow}`}
                aria-current={i === index}
                className="group flex-1 text-left"
              >
                <span
                  className={`mb-2 hidden text-xs font-medium transition sm:block ${
                    i === index ? "text-white" : "text-white/45 group-hover:text-white/80"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")} · {s.eyebrow}
                </span>
                <span className="block h-[3px] overflow-hidden rounded-full bg-white/20">
                  {i === index ? (
                    // The bar is the timer: when it fills, the next slide
                    // shows, and pausing it pauses the carousel in step.
                    <span
                      key={index}
                      onAnimationEnd={() => autoplay && go(index + 1)}
                      className="block h-full origin-left rounded-full bg-cream animate-progress"
                      style={{
                        animationDuration: `${INTERVAL_MS}ms`,
                        animationPlayState: paused || !autoplay ? "paused" : "running",
                      }}
                    />
                  ) : (
                    <span
                      className={`block h-full rounded-full ${i < index ? "bg-white/60" : ""}`}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
          <div className="hidden gap-2 md:flex">
            {[-1, 1].map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => go(index + dir)}
                aria-label={dir < 0 ? "Предыдущий слайд" : "Следующий слайд"}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-white transition hover:border-white hover:bg-white hover:text-navy"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d={dir < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
