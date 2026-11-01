"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export interface BannerShot {
  src: string;
  name: string;
  href?: string;
}

const STEP_MS = 4500;

/**
 * The opening band of a catalog page: the section's name on navy, and a
 * framed photo of its own models that changes every few seconds — at full
 * product-photo resolution rather than a stretched cover.
 */
export function CatalogBanner({
  title,
  subtitle,
  shots,
}: {
  title: string;
  subtitle?: string;
  shots: BannerShot[];
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (shots.length < 2) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % shots.length), STEP_MS);
    return () => clearInterval(t);
  }, [shots.length]);

  const current = shots[index];

  return (
    <div className="relative isolate overflow-hidden rounded-[2rem] bg-navy text-white">
      <div aria-hidden className="absolute -left-20 -top-24 -z-10 h-72 w-72 rounded-full bg-clay/25 blur-3xl" />
      <div className="grid items-center gap-6 p-6 sm:grid-cols-[1fr_1.05fr] sm:p-8 lg:p-10">
        <div className="py-2 sm:py-6">
          <nav className="animate-fade-up text-xs text-white/60">
            <Link href="/" className="transition hover:text-white">
              Главная
            </Link>{" "}
            / <span className="text-white">{title}</span>
          </nav>
          <h1 className="mt-4 animate-fade-up font-heading text-3xl font-bold tracking-tight [animation-delay:120ms] sm:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 animate-fade-up text-sm text-white/70 [animation-delay:220ms]">{subtitle}</p>
          )}
          {shots.length > 1 && (
            <div className="mt-6 flex gap-1.5" aria-hidden>
              {shots.map((s, i) => (
                <span
                  key={s.src}
                  className={`h-1 rounded-full transition-all duration-500 ${i === index ? "w-8 bg-cream" : "w-3 bg-white/25"}`}
                />
              ))}
            </div>
          )}
        </div>

        {current && (
          <div className="relative aspect-[3/2] overflow-hidden rounded-[1.5rem] bg-cream-light">
            {shots.map((s, i) => (
              <div
                key={s.src}
                className={`absolute inset-0 transition-opacity duration-1000 ${i === index ? "opacity-100" : "opacity-0"}`}
                aria-hidden={i !== index}
              >
                {(i === 0 || i === index || Math.abs(i - index) === 1) && (
                  <div key={i === index ? `on-${index}` : "off"} className={`absolute inset-0 bg-cream-light ${i === index ? "animate-drift" : ""}`}>
                    <Image
                      src={s.src}
                      alt={s.name}
                      fill
                      priority={i === 0}
                      quality={85}
                      sizes="(min-width: 1280px) 620px, (min-width: 640px) 52vw, 100vw"
                      // contain: studio shots are often taller than the frame and
                      // must not lose their top and bottom; 3:2 interiors fill it anyway.
                      className="object-contain mix-blend-multiply"
                    />
                  </div>
                )}
              </div>
            ))}
            {current.href ? (
              <Link
                key={`chip-${index}`}
                href={current.href}
                className="absolute bottom-3 left-3 animate-fade-up rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-navy shadow-lg backdrop-blur transition hover:bg-navy hover:text-white"
              >
                {current.name} →
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
