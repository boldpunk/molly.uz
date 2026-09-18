"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { submitRequest } from "@/lib/actions";
import { getHardwareBrandBadge } from "@/lib/hardware-brands";
import { PhoneInput } from "@/components/phone-input";
import { buildStatusDeepLink } from "@/lib/telegram-links";
import type { WardrobeFinish } from "@/lib/data";

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

// Used only if the admin hasn't configured any finishes yet (see
// /admin/configurator) — keeps the page from ever showing an empty state.
const DEFAULT_FINISHES: WardrobeFinish[] = [
  { id: "default-white", label: "Белый матовый", ral: "RAL 9010", hex: "#f2efe9" },
  { id: "default-grey", label: "Серый шёлк", ral: "RAL 7044", hex: "#bdb8ac" },
  { id: "default-beige", label: "Бежевый", ral: "RAL 1019", hex: "#a99578" },
  { id: "default-black", label: "Чёрный матовый", ral: "RAL 9005", hex: "#1c1c1c" },
];

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

type FillingId = (typeof FILLINGS)[number]["id"];
type InteriorKind = "rod" | "shelves" | "drawers" | "cubbies";

// Deterministic per-module layout so the interior view visibly differs
// between the two filling types, matching their descriptions: classic is
// mostly hanging space with drawers at the sides; the system variant is
// mostly shelving with a dedicated accessories module.
function moduleInteriorKind(i: number, modules: number, filling: FillingId): InteriorKind {
  const mid = Math.floor(modules / 2);
  if (filling === "classic") {
    if (i === 0 || i === modules - 1) return "drawers";
    if (i === mid) return "rod";
    return "shelves";
  }
  if (i === modules - 1) return "drawers";
  if (i === 0) return "cubbies";
  if (i === mid) return "rod";
  return "shelves";
}

function InteriorShelves({
  x,
  doorW,
  h,
  count,
  lineColour,
}: {
  x: number;
  doorW: number;
  h: number;
  count: number;
  lineColour: string;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const y = ((i + 1) / (count + 1)) * h;
        return (
          <rect key={i} x={x + 4} y={y} width={doorW - 8} height={2.5} fill={lineColour} />
        );
      })}
    </>
  );
}

function InteriorRod({
  x,
  doorW,
  h,
  lineColour,
  withShelfBelow,
}: {
  x: number;
  doorW: number;
  h: number;
  lineColour: string;
  withShelfBelow: boolean;
}) {
  const rodY = h * 0.16;
  const hangerXs = [x + doorW * 0.3, x + doorW * 0.5, x + doorW * 0.7];
  return (
    <>
      <rect x={x + 4} y={rodY} width={doorW - 8} height={2.5} fill={lineColour} />
      {hangerXs.map((hx, i) => (
        <path
          key={i}
          d={`M ${hx} ${rodY + 2} l -3 8 l 6 0 Z`}
          fill={lineColour}
        />
      ))}
      {withShelfBelow && (
        <InteriorShelves x={x} doorW={doorW} h={h - h * 0.55} count={2} lineColour={lineColour} />
      )}
    </>
  );
}

function InteriorDrawers({
  x,
  doorW,
  h,
  lineColour,
  dark,
}: {
  x: number;
  doorW: number;
  h: number;
  lineColour: string;
  dark: boolean;
}) {
  const count = 3;
  const gap = 4;
  const drawerH = (h - gap * (count + 1)) / count;
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const y = gap + i * (drawerH + gap);
        return (
          <g key={i}>
            <rect
              x={x + 4}
              y={y}
              width={doorW - 8}
              height={drawerH}
              rx={2}
              fill="none"
              stroke={lineColour}
              strokeWidth={1.5}
            />
            <rect
              x={x + doorW / 2 - 6}
              y={y + drawerH / 2 - 1}
              width={12}
              height={2}
              rx={1}
              fill={dark ? "#e8e2d6" : "#0b1a2d"}
              opacity={0.6}
            />
          </g>
        );
      })}
    </>
  );
}

function InteriorCubbies({
  x,
  doorW,
  h,
  lineColour,
}: {
  x: number;
  doorW: number;
  h: number;
  lineColour: string;
}) {
  const bandH = h * 0.4;
  const cols = 2;
  const rows = 2;
  const cellW = (doorW - 8) / cols;
  const cellH = bandH / rows;
  return (
    <>
      {Array.from({ length: cols * rows }).map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        return (
          <rect
            key={i}
            x={x + 4 + col * cellW + 1.5}
            y={row * cellH + 1.5}
            width={cellW - 3}
            height={cellH - 3}
            rx={1.5}
            fill="none"
            stroke={lineColour}
            strokeWidth={1.5}
          />
        );
      })}
      <InteriorShelves x={x} doorW={doorW} h={h - bandH} count={2} lineColour={lineColour} />
    </>
  );
}

function WardrobeDiagram({
  modules,
  finishSwatch,
  mirror,
  rails,
  handleType,
  filling,
  view,
}: {
  modules: number;
  finishSwatch: string;
  mirror: boolean;
  rails: boolean;
  handleType: string;
  filling: FillingId;
  view: "facade" | "interior";
}) {
  const doorW = 64;
  const gap = 3;
  const totalW = modules * doorW + (modules - 1) * gap;
  const h = 220;
  const dark = isDarkColour(finishSwatch);
  const lineColour = dark ? "rgba(255,255,255,0.18)" : "rgba(11,26,45,0.12)";
  const interiorLine = "rgba(11,26,45,0.35)";

  return (
    <svg
      viewBox={`0 0 ${totalW} ${h + 24}`}
      width={totalW}
      height={h + 24}
      style={{ width: "100%", height: "auto" }}
      className="mx-auto block max-w-md"
      role="img"
      aria-label={`Схема шкафа из ${modules} модулей — ${
        view === "facade" ? "фасад" : "наполнение"
      }`}
    >
      <rect x={0} y={h + 4} width={totalW} height={6} rx={2} fill="#0b1a2d" opacity={0.15} />
      {Array.from({ length: modules }).map((_, i) => {
        const x = i * (doorW + gap);
        const handleOnLeft = i % 2 === 0;

        if (view === "interior") {
          const kind = moduleInteriorKind(i, modules, filling);
          return (
            <g key={i}>
              <rect
                x={x}
                y={0}
                width={doorW}
                height={h}
                rx={3}
                fill="#faf8f4"
                stroke="rgba(11,26,45,0.25)"
                strokeWidth={1}
              />
              {kind === "shelves" && (
                <InteriorShelves
                  x={x}
                  doorW={doorW}
                  h={h}
                  count={filling === "system" ? 5 : 3}
                  lineColour={interiorLine}
                />
              )}
              {kind === "rod" && (
                <InteriorRod
                  x={x}
                  doorW={doorW}
                  h={h}
                  lineColour={interiorLine}
                  withShelfBelow={filling === "system"}
                />
              )}
              {kind === "drawers" && (
                <InteriorDrawers x={x} doorW={doorW} h={h} lineColour={interiorLine} dark={false} />
              )}
              {kind === "cubbies" && (
                <InteriorCubbies x={x} doorW={doorW} h={h} lineColour={interiorLine} />
              )}
            </g>
          );
        }

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
  finishes,
}: {
  productId?: string;
  productSlug: string;
  categorySlug: string;
  finishes: WardrobeFinish[];
}) {
  const finishOptions = finishes.length > 0 ? finishes : DEFAULT_FINISHES;

  const [modules, setModules] = useState(6);
  const [filling, setFilling] = useState<(typeof FILLINGS)[number]["id"]>("classic");
  const [finish, setFinish] = useState<string>(finishOptions[0].id);
  const [view, setView] = useState<"facade" | "interior">("facade");
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
  const finishOption =
    finishOptions.find((f) => f.id === finish) ?? finishOptions[0];
  const handleLabel = HANDLE_TYPES.find((h) => h.id === handleType)!.label;
  const hingeLabel = HINGES.find((h) => h.id === hinge)!.label;

  const specLines = useMemo(
    () => [
      `Ширина: ${modules} модуля × ${MODULE_WIDTH_MM} мм = ${widthMm} мм (${widthM.toFixed(2)} м)`,
      `Высота: ${HEIGHT_MM} мм (стандарт)`,
      `Глубина: ${DEPTH_MM} мм (стандарт)`,
      `Количество фасадов: ${modules} шт.`,
      `Наполнение: ${fillingLabel}`,
      `Отделка фасада: ${finishOption.label}${finishOption.ral ? ` (${finishOption.ral})` : ""}`,
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
              {finishOptions.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFinish(f.id)}
                  title={f.ral ? `${f.label} (${f.ral})` : f.label}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                    finish === f.id
                      ? "border-accent-dark bg-accent/10 font-medium text-navy"
                      : "border-navy/15 text-navy/70 hover:bg-navy/5"
                  }`}
                >
                  <span
                    className="h-5 w-5 shrink-0 rounded-full border border-navy/10"
                    style={{ backgroundColor: f.hex }}
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
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-wide text-navy/50">
                  Схема шкафа
                </p>
                <div className="flex rounded-full border border-navy/15 bg-white p-0.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setView("facade")}
                    className={`rounded-full px-3 py-1 transition ${
                      view === "facade" ? "bg-navy text-white" : "text-navy/60 hover:text-navy"
                    }`}
                  >
                    Фасад
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("interior")}
                    className={`rounded-full px-3 py-1 transition ${
                      view === "interior" ? "bg-navy text-white" : "text-navy/60 hover:text-navy"
                    }`}
                  >
                    Внутри
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <WardrobeDiagram
                  modules={modules}
                  finishSwatch={finishOption.hex}
                  mirror={mirror}
                  rails={rails}
                  handleType={handleType}
                  filling={filling}
                  view={view}
                />
              </div>
              <p className="mt-2 text-center text-xs text-navy/40">
                {view === "facade"
                  ? "Схематичный вид фасада — реальные пропорции уточняются на замере"
                  : "Схематичное наполнение по выбранному типу — точную раскладку секций подтвердит замерщик"}
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
