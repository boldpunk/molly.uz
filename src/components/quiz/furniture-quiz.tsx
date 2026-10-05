"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { MOODS, ROOMS, SIZES, TIMING, recommend, type Mood, type Room } from "@/lib/quiz";
import { submitRequest } from "@/lib/actions";
import { reachGoal } from "@/components/yandex-metrika";
import { PhoneInput } from "@/components/phone-input";
import { ProductCard } from "@/components/product-card";
import { getCategoryIcon } from "@/components/icons/categories";
import { buildStatusDeepLink } from "@/lib/telegram-links";

type Size = (typeof SIZES)[number]["id"];
type Timing = (typeof TIMING)[number]["id"];

const STEPS = ["Комната", "Настроение", "Помещение", "Сроки"] as const;

/** The progress bar is a measuring tape — fitting for a company that starts every job with a замер. */
function TapeProgress({ step }: { step: number }) {
  const pct = Math.min(100, (step / STEPS.length) * 100);
  return (
    <div className="relative">
      <div className="relative h-9 overflow-hidden rounded-lg bg-[#f3e3c4] ring-1 ring-[#e0c896]">
        <div
          className="absolute inset-y-0 left-0 bg-[#e8c97f] transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ width: `${pct}%` }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #182b4c 0 1px, transparent 1px 10px), repeating-linear-gradient(90deg, #182b4c 0 1px, transparent 1px 50px)",
            backgroundSize: "100% 30%, 100% 55%",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="absolute inset-0 flex items-end justify-between px-2 pb-0.5 text-[9px] font-semibold text-navy/60">
          {STEPS.map((s, i) => (
            <span key={s} className={i < step ? "text-navy" : ""}>
              {(i + 1) * 25}
            </span>
          ))}
        </div>
      </div>
      <span
        aria-hidden
        className="absolute -top-1.5 h-12 w-1 rounded-full bg-clay shadow transition-[left] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ left: `calc(${pct}% - 2px)` }}
      />
    </div>
  );
}

function Option({
  active,
  onClick,
  children,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative flex rounded-3xl p-5 text-left transition duration-300 hover:-translate-y-0.5 ${
        active
          ? "bg-navy text-white shadow-xl shadow-navy/20"
          : "bg-white text-navy ring-1 ring-navy/10 hover:shadow-lg hover:shadow-navy/10 hover:ring-navy/25"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function FurnitureQuiz({
  products,
  initialRoom,
}: {
  products: Product[];
  initialRoom?: Room;
}) {
  const [step, setStep] = useState(initialRoom ? 1 : 0);
  const [room, setRoom] = useState<Room | null>(initialRoom ?? null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [timing, setTiming] = useState<Timing | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "submitted" | "error">("idle");
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const picks = useMemo(() => (room ? recommend(products, room, mood, 3) : []), [products, room, mood]);
  const roomInfo = ROOMS.find((r) => r.id === room);
  const moodInfo = MOODS.find((m) => m.id === mood);
  const sizeInfo = SIZES.find((s) => s.id === size);
  const timingInfo = TIMING.find((t) => t.id === timing);
  const done = step >= STEPS.length;

  function next<T>(set: (v: T) => void, value: T) {
    set(value);
    // A short pause lets the chosen tile light up before the step moves on.
    setTimeout(() => setStep((s) => s + 1), 220);
  }

  const summary = [
    roomInfo && ["Комната", roomInfo.label],
    moodInfo && ["Настроение", moodInfo.label],
    sizeInfo && ["Помещение", `${sizeInfo.label}, ${sizeInfo.note}`],
    timingInfo && ["Сроки", timingInfo.label],
  ].filter(Boolean) as [string, string][];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    const notes = `Подбор на сайте: ${summary.map(([k, v]) => `${k} — ${v}`).join("; ")}`;
    try {
      const result = await submitRequest(
        name,
        phone,
        notes,
        picks.map((p) => ({
          productId: p.id,
          productName: p.name,
          categorySlug: p.categorySlug,
          productSlug: p.slug,
        }))
      );
      if (!result.ok) {
        setError(result.error);
        setStatus("error");
        return;
      }
      setOrderNumber(result.orderNumber);
      setStatus("submitted");
      reachGoal("request_submit", { source: "quiz" });
    } catch {
      setError("Не удалось отправить заявку. Попробуйте ещё раз.");
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-20 sm:px-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <TapeProgress step={step} />
        <div className="mt-3 flex items-center justify-between text-xs text-navy/50">
          <span>{done ? "Готово" : `Шаг ${step + 1} из ${STEPS.length} · ${STEPS[step]}`}</span>
          {step > 0 && status !== "submitted" && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="font-semibold text-navy/60 hover:text-navy">
              ← Назад
            </button>
          )}
        </div>

        <div key={step} className="mt-8 animate-fade-up">
          {step === 0 && (
            <>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-navy sm:text-4xl">Что будем обновлять?</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {ROOMS.map((r) => {
                  const Icon = getCategoryIcon(r.categories[0]);
                  return (
                    <Option key={r.id} active={room === r.id} onClick={() => next(setRoom, r.id)} className="items-center gap-4">
                      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition ${room === r.id ? "bg-white/15" : "bg-cream-light group-hover:bg-cream"}`}>
                        <Icon className="h-7 w-7" />
                      </span>
                      <span>
                        <span className="block font-heading text-lg font-bold">{r.label}</span>
                        <span className={`text-sm ${room === r.id ? "text-white/65" : "text-navy/55"}`}>{r.note}</span>
                      </span>
                    </Option>
                  );
                })}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-navy sm:text-4xl">Какое настроение ближе?</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {MOODS.map((m) => (
                  <Option key={m.id} active={mood === m.id} onClick={() => next(setMood, m.id)} className="flex-col gap-4">
                    <span className="flex h-20 overflow-hidden rounded-2xl">
                      {m.colours.map((c, i) => (
                        <span
                          key={c}
                          className="flex-1 transition-[flex] duration-500 group-hover:[flex:1.4] group-hover:first:[flex:1]"
                          style={{ backgroundColor: c, transitionDelay: `${i * 40}ms` }}
                        />
                      ))}
                    </span>
                    <span>
                      <span className="block font-heading text-lg font-bold">{m.label}</span>
                      <span className={`text-sm ${mood === m.id ? "text-white/65" : "text-navy/55"}`}>{m.note}</span>
                    </span>
                  </Option>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-navy sm:text-4xl">Какое помещение?</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {SIZES.map((s, i) => (
                  <Option key={s.id} active={size === s.id} onClick={() => next(setSize, s.id)} className="flex-col items-start gap-5">
                    <span aria-hidden className="flex h-16 items-end">
                      <span
                        className={`block rounded-md border-2 border-dashed transition ${size === s.id ? "border-white/60" : "border-navy/25 group-hover:border-clay"}`}
                        style={{ width: 28 + i * 18, height: 28 + i * 16 }}
                      />
                    </span>
                    <span>
                      <span className="block font-heading text-lg font-bold">{s.label}</span>
                      <span className={`text-sm ${size === s.id ? "text-white/65" : "text-navy/55"}`}>{s.note}</span>
                    </span>
                  </Option>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-navy sm:text-4xl">Когда планируете?</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {TIMING.map((t) => (
                  <Option key={t.id} active={timing === t.id} onClick={() => next(setTiming, t.id)} className="flex-col gap-1">
                    <span className="font-heading text-lg font-bold">{t.label}</span>
                    <span className={`text-sm ${timing === t.id ? "text-white/65" : "text-navy/55"}`}>{t.note}</span>
                  </Option>
                ))}
              </div>
            </>
          )}

          {done && (
            <>
              <span className="eyebrow">Ваша подборка</span>
              <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight text-navy sm:text-4xl">
                {picks.length > 0 ? "Вот что подойдёт вам" : "Сделаем под вас"}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-navy/60">
                {picks.length > 0
                  ? `Модели под настроение «${moodInfo?.label.toLowerCase() ?? "любое"}». Каждую изготовим в нужном цвете и размере — менеджер посчитает точную стоимость.`
                  : "Готовых моделей в этом разделе пока нет на сайте — изготовим по вашему проекту. Оставьте телефон, и дизайнер предложит варианты."}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3">
                {picks.map((p, i) => (
                  <div key={p.id} className="h-full animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                    <ProductCard product={p} />
                  </div>
                ))}
                {room === "wardrobe" && (
                  <Link
                    href="/configurator/shkaf"
                    className="group flex h-full min-h-56 flex-col justify-between rounded-2xl bg-navy p-5 text-white transition hover:-translate-y-1"
                  >
                    <span className="eyebrow text-cream">Конфигуратор</span>
                    <span>
                      <span className="block font-heading text-xl font-bold">Соберите шкаф сами</span>
                      <span className="mt-1 block text-sm text-white/60">Ширина, наполнение, цвет — схема меняется сразу</span>
                    </span>
                    <span className="text-sm font-semibold text-cream group-hover:underline">Открыть →</span>
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Project card — fills in as the visitor answers */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-navy/[0.06] ring-1 ring-navy/10">
          <div className="relative bg-cream-light px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-clay">Ваш проект</p>
            <p className="mt-1 font-heading text-lg font-bold text-navy">{roomInfo?.label ?? "Новый интерьер"}</p>
            {moodInfo && (
              <div className="mt-3 flex h-2 overflow-hidden rounded-full">
                {moodInfo.colours.map((c) => (
                  <span key={c} className="flex-1 animate-fade-in" style={{ backgroundColor: c }} />
                ))}
              </div>
            )}
          </div>
          <dl className="divide-y divide-navy/5 px-6">
            {STEPS.map((label, i) => {
              const row = summary.find(([k]) => k === label);
              return (
                <div key={label} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <dt className="text-navy/45">{label}</dt>
                  <dd key={row?.[1]} className={`text-right font-semibold ${row ? "animate-fade-in text-navy" : "text-navy/20"}`}>
                    {row?.[1] ?? (i === step ? "выбираем…" : "—")}
                  </dd>
                </div>
              );
            })}
          </dl>

          {done && status !== "submitted" && (
            <form onSubmit={handleSubmit} className="flex animate-fade-up flex-col gap-3 border-t border-navy/10 bg-navy p-6 text-white">
              <p className="font-heading text-lg font-bold">Получить расчёт</p>
              <p className="-mt-2 text-xs text-white/60">Перезвоним, уточним размеры и пришлём стоимость. Замер — бесплатно.</p>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input rounded-xl py-3"
                placeholder="Ваше имя"
                aria-label="Имя"
              />
              <PhoneInput required value={phone} onChange={setPhone} />
              {status === "error" && <p className="text-sm font-medium text-red-300">{error}</p>}
              <button type="submit" disabled={status === "submitting"} className="btn btn-light py-3 disabled:opacity-60">
                {status === "submitting" ? "Отправляем…" : "Отправить подборку"}
              </button>
              <p className="text-[11px] text-white/45">
                Нажимая кнопку, вы соглашаетесь с{" "}
                <Link href="/privacy" className="underline hover:text-white">
                  политикой конфиденциальности
                </Link>
              </p>
            </form>
          )}

          {status === "submitted" && (
            <div className="animate-fade-up border-t border-navy/10 bg-sage-light p-6 text-center">
              <p className="font-heading text-lg font-bold text-navy">Подборка у нас!</p>
              {orderNumber && <p className="mt-1 text-xs text-navy/55">Заявка {orderNumber}</p>}
              <p className="mt-2 text-sm text-navy/70">Менеджер свяжется с вами{name ? `, ${name}` : ""}, в рабочее время.</p>
              <a
                href={buildStatusDeepLink(phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn mt-4 w-full bg-[#2AABEE] py-3 text-white"
              >
                Статус в Telegram
              </a>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
