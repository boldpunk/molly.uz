"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { submitRequest } from "@/lib/actions";
import { getHardwareBrandBadge } from "@/lib/hardware-brands";
import { PhoneInput } from "@/components/phone-input";
import { buildStatusDeepLink } from "@/lib/telegram-links";

const MODULE_WIDTH_MM = 366;
const HEIGHT_MM = 2300;
const DEPTH_MM = 600;
const MIN_MODULES = 2;
const MAX_MODULES = 8;

const FILLINGS = [
  {
    id: "classic",
    label: "Классическое наполнение",
    description: "Полки, штанга для одежды, ящики по бокам",
  },
  {
    id: "system",
    label: "Гардеробная система",
    description: "Секции с ящиками, полками и местом для аксессуаров",
  },
] as const;

const FINISHES = [
  { id: "white", label: "Белый матовый", ral: "RAL 9010", swatch: "#f2efe9" },
  { id: "grey", label: "Серый шёлк", ral: "RAL 7044", swatch: "#bdb8ac" },
  { id: "beige", label: "Бежевый", ral: "RAL 1019", swatch: "#a99578" },
  { id: "black", label: "Чёрный матовый", ral: "RAL 9005", swatch: "#1c1c1c" },
] as const;

const HANDLE_TYPES = [
  { id: "накладные", label: "Накладные" },
  { id: "врезные", label: "Врезные (без ручек, push-to-open)" },
] as const;

const HINGES = [
  { id: "blum", label: "Blum" },
  { id: "hettich", label: "Hettich" },
  { id: "higold", label: "Higold" },
] as const;

function isDarkColour(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

function WardrobeDiagram({
  modules,
  finishSwatch,
  mirror,
  rails,
  handleType,
}: {
  modules: number;
  finishSwatch: string;
  mirror: boolean;
  rails: boolean;
  handleType: string;
}) {
  const doorW = 64;
  const gap = 3;
  const totalW = modules * doorW + (modules - 1) * gap;
  const h = 220;
  const dark = isDarkColour(finishSwatch);
  const lineColour = dark ? "rgba(255,255,255,0.18)" : "rgba(11,26,45,0.12)";

  return (
    <svg
      viewBox={`0 0 ${totalW} ${h + 24}`}
      width={totalW}
      height={h + 24}
      style={{ width: "100%", height: "auto" }}
      className="mx-auto block max-w-md"
      role="img"
      aria-label={`Схема шкафа из ${modules} модулей`}
    >
      <rect x={0} y={h + 4} width={totalW} height={6} rx={2} fill="#0b1a2d" opacity={0.15} />
      {Array.from({ length: modules }).map((_, i) => {
        const x = i * (doorW + gap);
        const handleOnLeft = i % 2 === 0;
        return (
          <g key={i}>
            <rect
              x={x}
              y={0}
              width={doorW}
              height={h}
              rx={3}
              fill={finishSwatch}
              stroke={dark ? "rgba(255,255,255,0.25)" : "rgba(11,26,45,0.2)"}
              strokeWidth={1}
            />
            {mirror && (
              <rect
                x={x + 4}
                y={4}
                width={doorW - 8}
                height={h - 8}
                rx={2}
                fill="url(#mirror-sheen)"
              />
            )}
            {rails && (
              <>
                <rect x={x + 6} y={h * 0.28} width={doorW - 12} height={3} fill={lineColour} />
                <rect x={x + 6} y={h * 0.72} width={doorW - 12} height={3} fill={lineColour} />
              </>
            )}
            {handleType === "накладные" && (
              <rect
                x={handleOnLeft ? x + 5 : x + doorW - 8}
                y={h * 0.42}
                width={3}
                height={h * 0.16}
                rx={1.5}
                fill={dark ? "#e8e2d6" : "#0b1a2d"}
                opacity={0.8}
              />
            )}
          </g>
        );
      })}
      <defs>
        <linearGradient id="mirror-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.35} />
          <stop offset="45%" stopColor="#ffffff" stopOpacity={0.05} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
      {n}
    </span>
  );
}

export function WardrobeConfigurator({
  productId,
  productSlug,
  categorySlug,
}: {
  productId?: string;
  productSlug: string;
  categorySlug: string;
}) {
  const [modules, setModules] = useState(6);
  const [filling, setFilling] = useState<(typeof FILLINGS)[number]["id"]>("classic");
  const [finish, setFinish] = useState<(typeof FINISHES)[number]["id"]>("white");
  const [mirror, setMirror] = useState(false);
  const [rails, setRails] = useState(false);
  const [handleType, setHandleType] =
    useState<(typeof HANDLE_TYPES)[number]["id"]>("накладные");
  const [hinge, setHinge] = useState<(typeof HINGES)[number]["id"]>("blum");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "submitted" | "error">(
    "idle"
  );

  const widthMm = modules * MODULE_WIDTH_MM;
  const widthM = widthMm / 1000;

  const fillingLabel = FILLINGS.find((f) => f.id === filling)!.label;
  const finishOption = FINISHES.find((f) => f.id === finish)!;
  const handleLabel = HANDLE_TYPES.find((h) => h.id === handleType)!.label;
  const hingeLabel = HINGES.find((h) => h.id === hinge)!.label;

  const specLines = useMemo(
    () => [
      `Ширина: ${modules} модуля × ${MODULE_WIDTH_MM} мм = ${widthMm} мм (${widthM.toFixed(2)} м)`,
      `Высота: ${HEIGHT_MM} мм (стандарт)`,
      `Глубина: ${DEPTH_MM} мм (стандарт)`,
      `Количество фасадов: ${modules} шт.`,
      `Наполнение: ${fillingLabel}`,
      `Отделка фасада: ${finishOption.label} (${finishOption.ral})`,
      `Зеркало на фасадах: ${mirror ? "да" : "нет"}`,
      `Декоративные рейки: ${rails ? "да" : "нет"}`,
      `Ручки: ${handleLabel}`,
      `Петли: ${hingeLabel}`,
    ],
    [modules, widthMm, widthM, fillingLabel, finishOption, mirror, rails, handleLabel, hingeLabel]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    try {
      await submitRequest(name, phone, comment, [
        {
          productId,
          productName: "Шкаф — по конфигуратору",
          categorySlug,
          productSlug,
          hardwareLabel: `Петли ${hingeLabel}`,
          colourLabel: specLines.join(" · "),
          widthMetres: widthM,
        },
      ]);
      setStatus("submitted");
    } catch {
      setStatus("error");
    }
  }

  if (status === "submitted") {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="font-heading text-2xl font-bold text-navy">
          Заявка отправлена
        </h1>
        <p className="mt-3 text-sm text-navy/70">
          Спасибо{name ? `, ${name}` : ""}! Мы получили конфигурацию шкафа и
          свяжемся с вами по телефону {phone}, чтобы уточнить детали, стоимость
          и записать на замер.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href={buildStatusDeepLink(phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-[#2AABEE] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2AABEE]/90"
          >
            Статус заявки в Telegram
          </a>
          <Link
            href="/"
            className="inline-block rounded-full border border-navy/15 px-6 py-3 text-sm font-semibold text-navy hover:bg-navy/5"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-navy/[0.02]">
      <div className="border-b border-navy/10 bg-gradient-to-br from-navy via-navy to-[#16324f] text-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <nav className="text-xs text-white/60">
            <Link href="/" className="hover:underline">
              Главная
            </Link>{" "}
            /{" "}
            <Link href="/catalog/garderoby" className="hover:underline">
              Гардеробы
            </Link>{" "}
            / <span className="text-white">Конфигуратор шкафа</span>
          </nav>

          <span className="mt-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
            Онлайн-конфигуратор · модульная система {MODULE_WIDTH_MM} мм
          </span>
          <h1 className="mt-4 font-heading text-2xl font-bold md:text-3xl">
            Конфигуратор шкафа
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            Соберите шкаф из модулей шириной {MODULE_WIDTH_MM} мм, выберите
            наполнение, отделку фасада и фурнитуру. Справа — живая схема
            вашей конфигурации. В конце оставьте контакты — мы посчитаем
            точную стоимость и запишем вас на замер.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mt-0 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        {/* Configurator fields */}
        <div className="flex flex-col gap-6 rounded-xl border border-navy/10 bg-white p-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
                <StepBadge n={1} />
                Количество модулей ({MODULE_WIDTH_MM} мм каждый)
              </h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModules((m) => Math.max(MIN_MODULES, m - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-navy/15 text-navy hover:bg-navy/5"
                  aria-label="Меньше модулей"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-semibold text-navy">
                  {modules}
                </span>
                <button
                  type="button"
                  onClick={() => setModules((m) => Math.min(MAX_MODULES, m + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-navy/15 text-navy hover:bg-navy/5"
                  aria-label="Больше модулей"
                >
                  +
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-navy/50">
              Общая ширина: {widthMm} мм ({widthM.toFixed(2)} м) · высота{" "}
              {HEIGHT_MM} мм · глубина {DEPTH_MM} мм
            </p>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
              <StepBadge n={2} />
              Наполнение
            </h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {FILLINGS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilling(f.id)}
                  className={`rounded-lg border p-3 text-left transition ${
                    filling === f.id
                      ? "border-accent-dark bg-accent/10"
                      : "border-navy/15 hover:bg-navy/5"
                  }`}
                >
                  <span className="block text-sm font-medium text-navy">
                    {f.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-navy/50">
                    {f.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
              <StepBadge n={3} />
              Отделка фасада
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {FINISHES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFinish(f.id)}
                  title={`${f.label} (${f.ral})`}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                    finish === f.id
                      ? "border-accent-dark bg-accent/10 font-medium text-navy"
                      : "border-navy/15 text-navy/70 hover:bg-navy/5"
                  }`}
                >
                  <span
                    className="h-5 w-5 shrink-0 rounded-full border border-navy/10"
                    style={{ backgroundColor: f.swatch }}
                  />
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
              <StepBadge n={4} />
              Дополнительно
            </h3>
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                checked={mirror}
                onChange={(e) => setMirror(e.target.checked)}
                className="h-4 w-4 accent-accent-dark"
              />
              Зеркало на фасадах
            </label>
            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                checked={rails}
                onChange={(e) => setRails(e.target.checked)}
                className="h-4 w-4 accent-accent-dark"
              />
              Декоративные рейки (МДФ)
            </label>
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
              <StepBadge n={5} />
              Ручки
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {HANDLE_TYPES.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setHandleType(h.id)}
                  className={`rounded-lg border px-4 py-2 text-sm transition ${
                    handleType === h.id
                      ? "border-accent-dark bg-accent/10 font-medium text-navy"
                      : "border-navy/15 text-navy/70 hover:bg-navy/5"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
              <StepBadge n={6} />
              Петли
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {HINGES.map((h) => {
                const badge = getHardwareBrandBadge(h.id, h.label);
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setHinge(h.id)}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition ${
                      hinge === h.id
                        ? "border-accent-dark bg-accent/20 font-medium text-navy"
                        : "border-navy/15 text-navy/70 hover:bg-navy/5"
                    }`}
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold"
                      style={{ backgroundColor: badge.bg, color: badge.fg }}
                    >
                      {badge.letter}
                    </span>
                    {h.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Result + contact form */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm">
            <div className="border-b border-navy/10 bg-navy/[0.03] p-5 pb-6">
              <p className="text-xs uppercase tracking-wide text-navy/50">
                Схема шкафа
              </p>
              <div className="mt-3">
                <WardrobeDiagram
                  modules={modules}
                  finishSwatch={finishOption.swatch}
                  mirror={mirror}
                  rails={rails}
                  handleType={handleType}
                />
              </div>
              <p className="mt-2 text-center text-xs text-navy/40">
                Схематичный вид — реальные пропорции уточняются на замере
              </p>
            </div>
            <div className="p-5">
              <p className="text-xs uppercase tracking-wide text-navy/50">
                Ваша конфигурация
              </p>
              <ul className="mt-3 flex flex-col gap-1.5 text-sm text-navy/80">
                {specLines.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-dark" />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-navy/50">
                Точная цена рассчитывается менеджером по вашей конфигурации —
                оставьте контакты ниже, и мы свяжемся с вами.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-xl border border-navy/10 bg-white p-5 shadow-sm"
          >
            <h3 className="text-sm font-semibold text-navy">Оставить заявку</h3>
            <div>
              <label className="text-sm font-medium text-navy">Имя</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy/15 px-3 py-2 text-sm"
                placeholder="Как к вам обращаться"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-navy">Телефон</label>
              <PhoneInput required value={phone} onChange={setPhone} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-navy">
                Комментарий (необязательно)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-md border border-navy/15 px-3 py-2 text-sm"
                placeholder="Адрес, удобное время для звонка и т.д."
              />
            </div>

            {status === "error" && (
              <p className="text-sm font-medium text-red-600">
                Не удалось отправить заявку. Попробуйте ещё раз.
              </p>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-60"
            >
              {status === "submitting" ? "Отправляем…" : "Отправить заявку"}
            </button>
            <p className="-mt-2 text-xs text-navy/40">
              Отправляя заявку, вы соглашаетесь с{" "}
              <Link href="/privacy" className="underline hover:text-navy">
                политикой конфиденциальности
              </Link>
              .
            </p>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
