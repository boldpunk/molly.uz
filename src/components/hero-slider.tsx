"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export interface HeroSlide {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  text: string;
  cta: { label: string; href: string };
  secondary?: { label: string; href: string };
  /** A real model from the catalogue shown on this slide. */
  product?: { name: string; href: string; note?: string };
}

const INTERVAL_MS = 6500;

function Arrow({ dir }: { dir: -1 | 1 }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={dir < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The photo sits in a framed panel beside the text rather than stretched
// across the whole screen: product renders are ~1500px wide, and blown up to
// a full-bleed banner they turned soft. In the frame they stay sharp.
export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Reduced motion shortens every animation to ~0ms, which would turn the
  // progress-bar timer into a runaway loop — autoplay stays off instead.
  const [autoplay, setAutoplay] = useState(true);
  const touchStart = useRef<number | null>(null);
  const count = slides.length;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setAutoplay(!media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count]
  );

  if (count === 0) return null;
  const slide = slides[index];

  return (
    <section
      className="relative overflow-hidden bg-cream-light"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      aria-roledescription="carousel"
      aria-label="Главные предложения"
    >
      <div aria-hidden className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-cream blur-3xl" />
      <div aria-hidden className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-clay-light/70 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-6 pb-12 pt-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:pb-16 lg:pt-12">
        {/* Photo */}
        <div
          className="relative lg:order-2"
          onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStart.current === null) return;
            const dx = e.changedTouches[0].clientX - touchStart.current;
            if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
            touchStart.current = null;
          }}
        >
          <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] bg-cream shadow-2xl shadow-navy/15 sm:rounded-[2.5rem]">
            {slides.map((s, i) => (
              <div
                key={s.image + i}
                aria-hidden={i !== index}
                className={`absolute inset-0 transition-[opacity,transform] duration-[1100ms] ease-out ${
                  i === index ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"
                }`}
              >
                <Image
                  src={s.image}
                  alt={s.alt}
                  fill
                  priority={i === 0}
                  quality={85}
                  sizes="(min-width: 1280px) 680px, (min-width: 1024px) 55vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/35 to-transparent" />

            {slide.product && (
              <Link
                key={`chip-${index}`}
                href={slide.product.href}
                className="group absolute bottom-4 left-4 right-4 flex animate-fade-up items-center justify-between gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-xl backdrop-blur [animation-delay:350ms] sm:bottom-6 sm:left-6 sm:right-auto sm:min-w-72"
              >
                <span>
                  <span className="block text-sm font-bold text-navy">{slide.product.name}</span>
                  {slide.product.note && (
                    <span className="block text-xs text-navy/55">{slide.product.note}</span>
                  )}
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-white transition duration-300 group-hover:bg-clay">
                  <Arrow dir={1} />
                </span>
              </Link>
            )}

            {count > 1 && (
              <div className="absolute right-4 top-4 flex gap-2 sm:right-6 sm:top-6">
                {([-1, 1] as const).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => go(index + dir)}
                    aria-label={dir < 0 ? "Предыдущий слайд" : "Следующий слайд"}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-navy shadow-lg backdrop-blur transition hover:bg-navy hover:text-white"
                  >
                    <Arrow dir={dir} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Text */}
        <div className="lg:order-1">
          <div key={index} className="min-h-[280px] sm:min-h-[300px]">
            <span className="eyebrow animate-fade-up [animation-delay:60ms]">{slide.eyebrow}</span>
            <h1 className="mt-4 animate-fade-up font-heading text-4xl font-bold leading-[1.08] tracking-tight text-navy [animation-delay:140ms] sm:text-5xl xl:text-6xl">
              {slide.title}
            </h1>
            <p className="mt-5 max-w-lg animate-fade-up text-base text-navy/65 [animation-delay:240ms] sm:text-lg">
              {slide.text}
            </p>
            <div className="mt-8 flex animate-fade-up flex-wrap gap-3 [animation-delay:340ms]">
              <Link href={slide.cta.href} className="btn btn-primary">
                {slide.cta.label}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              {slide.secondary && (
                <Link href={slide.secondary.href} className="btn btn-outline">
                  {slide.secondary.label}
                </Link>
              )}
            </div>
          </div>

          {/* Slide picker: thumbnail, name and a progress line that is also the timer */}
          {count > 1 && (
            <div className="mt-10 grid gap-3" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
              {slides.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Слайд ${i + 1}: ${s.eyebrow}`}
                  aria-current={i === index}
                  className="group text-left"
                >
                  <span className="hidden items-center gap-2.5 sm:flex">
                    <span
                      className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-xl transition duration-300 ${
                        i === index ? "ring-2 ring-navy ring-offset-2 ring-offset-cream-light" : "opacity-60 group-hover:opacity-100"
                      }`}
                    >
                      <Image src={s.image} alt="" fill sizes="96px" className="object-cover" />
                    </span>
                    <span
                      lang="ru"
                      className={`line-clamp-2 hyphens-auto text-xs font-semibold leading-tight transition [overflow-wrap:anywhere] ${
                        i === index ? "text-navy" : "text-navy/45 group-hover:text-navy/80"
                      }`}
                    >
                      {s.eyebrow}
                    </span>
                  </span>
                  <span className="mt-3 block h-[3px] overflow-hidden rounded-full bg-navy/10">
                    {i === index ? (
                      // The bar is the timer: when it fills, the next slide
                      // shows, and pausing it pauses the carousel in step.
                      <span
                        key={index}
                        onAnimationEnd={() => autoplay && go(index + 1)}
                        className="block h-full origin-left rounded-full bg-clay animate-progress"
                        style={{
                          animationDuration: `${INTERVAL_MS}ms`,
                          animationPlayState: paused || !autoplay ? "paused" : "running",
                        }}
                      />
                    ) : (
                      <span className={`block h-full rounded-full ${i < index ? "bg-navy/30" : ""}`} />
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
