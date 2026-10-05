"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

// Positions are percentages of the FIONA product photo (1536 × 1024).
const SPOTS = [
  { x: 40, y: 22, title: "Фасады", text: "KASTAMONU: матовый МДФ с ПВХ-плёнкой, 6 вариантов цвета." },
  { x: 14, y: 32, title: "До потолка", text: "Высота 260–270 см — больше места для хранения и никакой пыли сверху." },
  { x: 82, y: 52, title: "Колонна под технику", text: "Ниши делаем под размеры именно вашей духовки и микроволновки." },
  { x: 57, y: 59, title: "Любая ширина", text: "Кухню проектируем под ваше помещение — без шага стандартных модулей." },
  { x: 47, y: 71, title: "Фурнитура", text: "HIGOLD или BLUM на выбор — петли и направляющие ящиков." },
  { x: 24, y: 80, title: "Корпус", text: "3 цвета, PUR-клей — влагостойкий, ПВХ-кромка со всех сторон деталей." },
];

export function KitchenHotspots({ imageUrl, href }: { imageUrl: string; href: string }) {
  const [active, setActive] = useState<number>(0);
  const spot = SPOTS[active];

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="grid items-center gap-10 lg:grid-cols-[1.45fr_1fr]">
        <div className="relative overflow-hidden rounded-[2rem] bg-cream-light shadow-2xl shadow-navy/10">
          <div className="relative aspect-[3/2]">
            <Image src={imageUrl} alt="Кухня FIONA" fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
            {SPOTS.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => setActive(i)}
                onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
                aria-label={s.title}
                aria-pressed={active === i}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${s.x}%`, top: `${s.y}%` }}
              >
                <span
                  aria-hidden
                  className={`absolute inset-0 rounded-full bg-white ${active === i ? "" : "animate-pulse-ring"}`}
                  style={{ animationDelay: `${i * 300}ms` }}
                />
                <span
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-lg transition duration-300 sm:h-9 sm:w-9 ${
                    active === i ? "scale-110 bg-clay text-white" : "bg-white/95 text-navy hover:scale-110"
                  }`}
                >
                  {i + 1}
                </span>
              </button>
            ))}

            {/* Name tag beside the active point — the details live in the list */}
            <span
              key={active}
              className="pointer-events-none absolute z-10 hidden -translate-y-1/2 animate-fade-in whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-navy shadow-lg sm:block"
              style={{
                top: `${spot.y}%`,
                left: spot.x > 60 ? undefined : `calc(${spot.x}% + 26px)`,
                right: spot.x > 60 ? `calc(${100 - spot.x}% + 26px)` : undefined,
              }}
            >
              {spot.title}
            </span>
          </div>
        </div>

        <div>
          <span className="eyebrow">Под лупой</span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-navy sm:text-4xl">
            Из чего собрана кухня FIONA
          </h2>
          <p className="mt-3 text-navy/60">
            Наведите на точки на фото — или пройдитесь по списку. Так же устроены все наши кухни.
          </p>
          <ol className="mt-6 flex flex-col gap-1.5">
            {SPOTS.map((s, i) => (
              <li key={s.title}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
                  className={`flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left transition ${
                    active === i ? "bg-navy text-white shadow-lg shadow-navy/15" : "text-navy hover:bg-cream-light"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      active === i ? "bg-clay text-white" : "bg-cream text-navy"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{s.title}</span>
                    {active === i && <span className="mt-0.5 block animate-fade-in text-xs text-white/70">{s.text}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <Link href={href} className="btn btn-primary mt-6">
            Смотреть кухню FIONA
          </Link>
        </div>
      </div>
    </section>
  );
}
