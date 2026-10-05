"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { submitRequest } from "@/lib/actions";
import { reachGoal } from "@/components/yandex-metrika";
import { getHardwareBrandBadge } from "@/lib/hardware-brands";
import { PhoneInput } from "@/components/phone-input";
import { buildStatusDeepLink } from "@/lib/telegram-links";
import type { WardrobeFinish } from "@/lib/data";
import {
  encodeProject,
  fitNiche,
  MAX_MODULES,
  MIN_MODULES,
  type HandleId,
  type MirrorId,
  type SectionKind,
  type WardrobeProject,
} from "@/lib/wardrobe-project";

// All measurements follow the production drawings: 366 mm modules, a
// 2300 mm carcass on a 100 mm plinth, 600 mm deep, 2 mm gaps between
// facades and four hinges per door.
const MODULE_WIDTH_MM = 366;
const HEIGHT_MM = 2300;
const DEPTH_MM = 600;
const PLINTH_MM = 100;
const PANEL_MM = 16;
const GAP_MM = 2;
const HINGES_PER_DOOR = 4;
const ROD_HEIGHT_MM = 1700;
const DRAWER_HEIGHT_MM = 200;

// Used only if the admin hasn't configured any finishes yet (see
// /admin/configurator) — keeps the page from ever showing an empty state.
const DEFAULT_FINISHES: WardrobeFinish[] = [
  { id: "default-white", label: "Белый матовый", ral: "RAL 9010", hex: "#f2efe9" },
  { id: "default-grey", label: "Серый шёлк", ral: "RAL 7044", hex: "#bdb8ac" },
  { id: "default-beige", label: "Бежевый", ral: "RAL 1019", hex: "#a99578" },
  { id: "default-black", label: "Чёрный матовый", ral: "RAL 9005", hex: "#1c1c1c" },
];

const SECTIONS: Record<SectionKind, { label: string; hint: string }> = {
  shelves: { label: "Полки", hint: "6 полок по всей высоте" },
  hanging: { label: "Штанга", hint: "Длинная одежда, полка сверху и снизу" },
  drawers: { label: "Полки и ящики", hint: "3 ящика по 200 мм и полки над ними" },
  combo: { label: "Штанга и полки", hint: "Короткая одежда и полки под ней" },
};
const SECTION_ORDER: SectionKind[] = ["shelves", "hanging", "drawers", "combo"];

// Shelves (not counting the carcass top and bottom) each section adds.
const SHELVES_IN: Record<SectionKind, number> = { shelves: 6, hanging: 2, drawers: 4, combo: 3 };

const PRESETS: { id: string; label: string; build: (n: number) => SectionKind[] }[] = [
  {
    id: "classic",
    label: "Классика",
    build: (n) =>
      Array.from({ length: n }, (_, i) =>
        i === 0 || i === n - 1 ? "drawers" : i % 2 === 1 ? "hanging" : "shelves"
      ),
  },
  {
    id: "hanging",
    label: "Больше вешал",
    build: (n) =>
      Array.from({ length: n }, (_, i) =>
        i === 0 ? "drawers" : i % 3 === 2 ? "combo" : "hanging"
      ),
  },
  {
    id: "shelves",
    label: "Больше полок",
    build: (n) =>
      Array.from({ length: n }, (_, i) =>
        i === Math.floor(n / 2) ? "hanging" : i % 2 === 0 ? "drawers" : "shelves"
      ),
  },
];

const MIRRORS = [
  { id: "none", label: "Без зеркала" },
  { id: "center", label: "2 центральных" },
  { id: "all", label: "Все фасады" },
] as const;

const HANDLES = [
  { id: "накладные", label: "Накладные", note: "Чёрная планка" },
  { id: "врезные", label: "Врезной профиль", note: "Латунь, в торце" },
  { id: "push", label: "Без ручек", note: "Push-to-open" },
] as const;

const HINGES = [
  { id: "blum", label: "Blum" },
  { id: "higold", label: "Higold" },
] as const;

function isDarkColour(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

function mirrorDoors(modules: number, mirror: MirrorId): Set<number> {
  if (mirror === "all") return new Set(Array.from({ length: modules }, (_, i) => i));
  if (mirror === "none") return new Set();
  const mid = modules / 2;
  return modules % 2 === 0 ? new Set([mid - 1, mid]) : new Set([Math.floor(mid)]);
}

/* ------------------------------------------------------------------ */
/* Drawing — every coordinate is in millimetres                        */
/* ------------------------------------------------------------------ */

const OAK = "#eadfce";
const OAK_DARK = "#d6c6b0";
const OAK_EDGE = "#c4b098";
const GARMENTS = ["#2f3b4f", "#c9b8a3", "#8a7a70", "#e7e0d4", "#56617a", "#a99578"];

function Garments({ x, w, top, length, seed }: { x: number; w: number; top: number; length: number; seed: number }) {
  const count = Math.max(2, Math.floor(w / 80));
  const step = (w - 60) / count;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const gx = x + 40 + i * step + step / 2;
        const len = length * (0.72 + ((seed * 7 + i * 13) % 5) * 0.07);
        const colour = GARMENTS[(seed + i * 2) % GARMENTS.length];
        return (
          <g key={i}>
            <path d={`M ${gx} ${top} l -34 40 h 68 Z`} fill="none" stroke="#8b8f96" strokeWidth={5} />
            <rect x={gx - 36} y={top + 38} width={72} height={len} rx={14} fill={colour} opacity={0.92} />
          </g>
        );
      })}
    </>
  );
}

function Shelf({ x, w, y }: { x: number; w: number; y: number }) {
  return <rect x={x} y={y} width={w} height={PANEL_MM} fill={OAK_DARK} stroke={OAK_EDGE} strokeWidth={2} />;
}

function Boxes({ x, w, y, seed }: { x: number; w: number; y: number; seed: number }) {
  // Folded things resting on a shelf, purely to make the drawing read as a
  // lived-in wardrobe rather than a technical grid.
  if ((seed + Math.round(y)) % 3 === 0) {
    return <rect x={x + w * 0.2} y={y - 110} width={w * 0.6} height={110} rx={8} fill="#d8cfc3" stroke="#bfb3a3" strokeWidth={3} />;
  }
  return (
    <>
      {[0, 1, 2].map((k) => (
        <rect key={k} x={x + w * 0.22} y={y - 28 * (k + 1)} width={w * 0.56} height={26} rx={6} fill={GARMENTS[(seed + k) % GARMENTS.length]} opacity={0.75} />
      ))}
    </>
  );
}

function SectionInterior({ kind, x, w, seed }: { kind: SectionKind; x: number; w: number; seed: number }) {
  const top = PANEL_MM;
  const bottom = HEIGHT_MM - PLINTH_MM - PANEL_MM;
  const topShelf = top + 300;
  const rodY = HEIGHT_MM - ROD_HEIGHT_MM;
  const drawersTop = bottom - DRAWER_HEIGHT_MM * 3;
  const items: React.ReactNode[] = [];

  if (kind === "shelves") {
    const step = (bottom - top) / 7;
    for (let k = 1; k <= 6; k++) {
      const y = top + step * k;
      items.push(<Shelf key={`s${k}`} x={x} w={w} y={y} />);
      if (k % 2 === 1 || k === 6) items.push(<Boxes key={`b${k}`} x={x} w={w} y={y} seed={seed + k} />);
    }
    items.push(<Boxes key="bb" x={x} w={w} y={bottom} seed={seed} />);
  }

  if (kind === "hanging") {
    items.push(<Shelf key="t" x={x} w={w} y={topShelf} />);
    items.push(<Boxes key="tb" x={x} w={w} y={topShelf} seed={seed} />);
    items.push(<Garments key="g" x={x} w={w} top={rodY + 12} length={1050} seed={seed} />);
    items.push(<rect key="r" x={x + 10} y={rodY} width={w - 20} height={25} rx={12} fill="url(#chrome)" />);
    items.push(<Shelf key="b" x={x} w={w} y={bottom - 400} />);
    items.push(<Boxes key="bb" x={x} w={w} y={bottom - 400} seed={seed + 1} />);
  }

  if (kind === "combo") {
    items.push(<Shelf key="t" x={x} w={w} y={topShelf} />);
    items.push(<Garments key="g" x={x} w={w} top={rodY + 12} length={560} seed={seed} />);
    items.push(<rect key="r" x={x + 10} y={rodY} width={w - 20} height={25} rx={12} fill="url(#chrome)" />);
    [1320, 1720].forEach((y, k) => {
      items.push(<Shelf key={`s${k}`} x={x} w={w} y={y} />);
      items.push(<Boxes key={`b${k}`} x={x} w={w} y={y} seed={seed + k + 2} />);
    });
    items.push(<Boxes key="bb" x={x} w={w} y={bottom} seed={seed + 5} />);
  }

  if (kind === "drawers") {
    const step = (drawersTop - top) / 5;
    for (let k = 1; k <= 4; k++) {
      const y = top + step * k;
      items.push(<Shelf key={`s${k}`} x={x} w={w} y={y} />);
      items.push(<Boxes key={`b${k}`} x={x} w={w} y={y} seed={seed + k} />);
    }
    for (let k = 0; k < 3; k++) {
      const y = drawersTop + k * DRAWER_HEIGHT_MM;
      items.push(
        <g key={`d${k}`}>
          <rect x={x + 6} y={y + 6} width={w - 12} height={DRAWER_HEIGHT_MM - 12} rx={6} fill="#e3d6c5" stroke={OAK_EDGE} strokeWidth={3} />
          <rect x={x + w / 2 - 50} y={y + 40} width={100} height={16} rx={8} fill="#5b4a3a" opacity={0.55} />
        </g>
      );
    }
  }

  return <>{items}</>;
}

function DimensionH({ x1, x2, y, label, size = 60 }: { x1: number; x2: number; y: number; label: string; size?: number }) {
  return (
    <g className="text-navy" stroke="currentColor" fill="currentColor">
      <line x1={x1} y1={y} x2={x2} y2={y} strokeWidth={4} opacity={0.55} />
      <line x1={x1} y1={y - 26} x2={x1} y2={y + 26} strokeWidth={4} opacity={0.55} />
      <line x1={x2} y1={y - 26} x2={x2} y2={y + 26} strokeWidth={4} opacity={0.55} />
      <text x={(x1 + x2) / 2} y={y - 20} textAnchor="middle" fontSize={size} stroke="none" fontWeight={600}>
        {label}
      </text>
    </g>
  );
}

function DimensionV({ x, y1, y2, label }: { x: number; y1: number; y2: number; label: string }) {
  return (
    <g className="text-navy" stroke="currentColor" fill="currentColor">
      <line x1={x} y1={y1} x2={x} y2={y2} strokeWidth={4} opacity={0.55} />
      <line x1={x - 26} y1={y1} x2={x + 26} y2={y1} strokeWidth={4} opacity={0.55} />
      <line x1={x - 26} y1={y2} x2={x + 26} y2={y2} strokeWidth={4} opacity={0.55} />
      <text
        x={x - 24}
        y={(y1 + y2) / 2}
        textAnchor="middle"
        fontSize={64}
        stroke="none"
        fontWeight={600}
        transform={`rotate(-90 ${x - 24} ${(y1 + y2) / 2})`}
      >
        {label}
      </text>
    </g>
  );
}

type View = "facade" | "interior" | "side";

function WardrobeDrawing({
  view,
  layout,
  finish,
  mirror,
  rails,
  handle,
  openDoors,
  selected,
  onDoor,
  onSection,
}: {
  view: View;
  layout: SectionKind[];
  finish: string;
  mirror: MirrorId;
  rails: boolean;
  handle: HandleId;
  openDoors: Set<number>;
  selected: number | null;
  onDoor: (i: number) => void;
  onSection: (i: number) => void;
}) {
  const modules = layout.length;
  const W = view === "side" ? DEPTH_MM : modules * MODULE_WIDTH_MM;
  const padL = 170;
  const padR = 60;
  const padT = 60;
  const padB = view === "side" ? 200 : 330;
  const dark = isDarkColour(finish);
  const mirrors = mirrorDoors(modules, mirror);
  const facadeBottom = HEIGHT_MM - PLINTH_MM;

  return (
    <svg
      viewBox={`${-padL} ${-padT} ${W + padL + padR} ${HEIGHT_MM + padT + padB}`}
      className="mx-auto block h-auto max-h-[560px] w-full select-none"
      role="img"
      aria-label={`Шкаф ${modules} × ${MODULE_WIDTH_MM} мм, вид: ${
        view === "facade" ? "фасад" : view === "interior" ? "наполнение" : "сбоку"
      }`}
    >
      <defs>
        <linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f4f5f7" />
          <stop offset="50%" stopColor="#a9aeb6" />
          <stop offset="100%" stopColor="#e1e3e7" />
        </linearGradient>
        <linearGradient id="mirror" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#dfe6ea" />
          <stop offset="40%" stopColor="#aebbc3" />
          <stop offset="60%" stopColor="#c8d3d9" />
          <stop offset="100%" stopColor="#8e9ca5" />
        </linearGradient>
        <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.18} />
          <stop offset="100%" stopColor="#000" stopOpacity={0.06} />
        </linearGradient>
        <linearGradient id="brass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#d4ad6a" />
          <stop offset="50%" stopColor="#a87a3c" />
          <stop offset="100%" stopColor="#7b5629" />
        </linearGradient>
      </defs>

      {/* floor */}
      <ellipse cx={W / 2} cy={HEIGHT_MM + 10} rx={W * 0.55} ry={40} fill="#182b4c" opacity={0.08} />

      {view === "side" ? (
        <g className="animate-fade-in">
          <rect x={0} y={0} width={DEPTH_MM} height={HEIGHT_MM - PLINTH_MM} fill={OAK} stroke={OAK_EDGE} strokeWidth={4} />
          <rect x={20} y={HEIGHT_MM - PLINTH_MM} width={DEPTH_MM - 40} height={PLINTH_MM} fill={OAK_DARK} />
          <rect x={DEPTH_MM - 18} y={0} width={18} height={HEIGHT_MM - PLINTH_MM} fill={finish} stroke={OAK_EDGE} strokeWidth={2} />
          <DimensionV x={-90} y1={0} y2={HEIGHT_MM} label={`${HEIGHT_MM}`} />
          <DimensionH x1={0} x2={DEPTH_MM} y={HEIGHT_MM + 120} label={`${DEPTH_MM}`} size={64} />
        </g>
      ) : (
        <>
          {/* carcass */}
          <rect x={0} y={0} width={W} height={facadeBottom} fill={OAK} stroke={OAK_EDGE} strokeWidth={4} />
          <rect x={16} y={facadeBottom} width={W - 32} height={PLINTH_MM} fill={OAK_DARK} />

          {layout.map((kind, i) => {
            const x = i * MODULE_WIDTH_MM;
            const innerX = x + (i === 0 ? PANEL_MM : PANEL_MM / 2);
            const innerW = MODULE_WIDTH_MM - PANEL_MM - (i === 0 || i === modules - 1 ? PANEL_MM / 2 : 0);
            const doorX = x + GAP_MM / 2;
            const doorW = MODULE_WIDTH_MM - GAP_MM;
            const hingeLeft = i % 2 === 0;
            const isOpen = view === "interior" || openDoors.has(i);
            const isMirror = mirrors.has(i);
            const handleX = hingeLeft ? doorX + doorW - 42 : doorX + 26;

            return (
              <g key={i} className="animate-fade-in">
                {/* interior */}
                <g
                  onClick={view === "interior" ? () => onSection(i) : undefined}
                  className={view === "interior" ? "group cursor-pointer" : ""}
                >
                  <rect x={innerX} y={PANEL_MM} width={innerW} height={facadeBottom - PANEL_MM * 2} fill="#f3ece2" />
                  <SectionInterior kind={kind} x={innerX} w={innerW} seed={i * 3} />
                  {i > 0 && <rect x={x - PANEL_MM / 2} y={0} width={PANEL_MM} height={facadeBottom} fill={OAK_DARK} />}
                  {view === "interior" && (
                    <rect
                      x={innerX + 4}
                      y={PANEL_MM + 4}
                      width={innerW - 8}
                      height={facadeBottom - PANEL_MM * 2 - 8}
                      rx={10}
                      fill={selected === i ? "rgba(199,125,82,0.10)" : "rgba(199,125,82,0)"}
                      stroke="#c77d52"
                      strokeWidth={selected === i ? 14 : 8}
                      className={`transition-opacity duration-300 ${
                        selected === i ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                      }`}
                    />
                  )}
                  <title>{`Секция ${i + 1}: ${SECTIONS[kind].label}`}</title>
                </g>

                {/* door */}
                {view === "facade" && (
                  <g
                    onClick={() => onDoor(i)}
                    className="cursor-pointer"
                    style={{
                      transformBox: "fill-box",
                      transformOrigin: hingeLeft ? "left center" : "right center",
                      transform: isOpen ? "scaleX(0.12)" : "scaleX(1)",
                      transition: "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  >
                    <rect x={doorX} y={4} width={doorW} height={facadeBottom - 6} rx={4} fill={finish} stroke={dark ? "rgba(255,255,255,0.18)" : "rgba(24,43,76,0.18)"} strokeWidth={3} />
                    <rect x={doorX} y={4} width={doorW} height={facadeBottom - 6} rx={4} fill="url(#sheen)" />
                    {isMirror && (
                      <g>
                        <rect x={doorX + 36} y={40} width={doorW - 72} height={facadeBottom - 80} rx={6} fill="url(#mirror)" />
                        <path d={`M ${doorX + 70} ${220} l 120 -140 M ${doorX + 70} ${420} l 200 -230`} stroke="#fff" strokeWidth={10} opacity={0.35} />
                      </g>
                    )}
                    {rails && !isMirror &&
                      [0, 1, 2].map((k) => {
                        const rx = hingeLeft ? doorX + 48 + k * 32 : doorX + doorW - 68 - k * 32;
                        return (
                          <rect
                            key={k}
                            x={rx}
                            y={4}
                            width={20}
                            height={facadeBottom - 6}
                            fill={finish}
                            stroke={dark ? "rgba(255,255,255,0.22)" : "rgba(24,43,76,0.2)"}
                            strokeWidth={3}
                          />
                        );
                      })}
                    {handle === "накладные" && (
                      <rect x={handleX} y={1080} width={16} height={820} rx={8} fill={dark ? "#d9d2c5" : "#1f2023"} />
                    )}
                    {handle === "врезные" && (
                      <rect
                        x={hingeLeft ? doorX + doorW - 22 : doorX}
                        y={1000}
                        width={22}
                        height={720}
                        rx={10}
                        fill="url(#brass)"
                      />
                    )}
                    {isOpen && <rect x={doorX} y={4} width={doorW} height={facadeBottom - 6} fill="#000" opacity={0.18} />}
                    <title>{`Фасад ${i + 1} — нажмите, чтобы ${isOpen ? "закрыть" : "открыть"}`}</title>
                  </g>
                )}

                <DimensionH x1={x} x2={x + MODULE_WIDTH_MM} y={HEIGHT_MM + 110} label={`${MODULE_WIDTH_MM}`} size={modules > 6 ? 52 : 60} />
              </g>
            );
          })}

          <DimensionH x1={0} x2={W} y={HEIGHT_MM + 250} label={`${W}`} size={70} />
          <DimensionV x={-90} y1={0} y2={HEIGHT_MM} label={`${HEIGHT_MM}`} />
        </>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */

function Step({ n, title, children, aside }: { n: number; title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="border-b border-navy/10 py-6 first:pt-0 last:border-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-3 font-heading text-base font-bold text-navy">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-cream">
            {n}
          </span>
          {title}
        </h3>
        {aside}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Choice({
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
      className={`rounded-2xl border px-4 py-3 text-left text-sm transition duration-300 ${
        active
          ? "border-navy bg-navy text-white shadow-lg shadow-navy/20"
          : "border-navy/15 text-navy hover:border-navy/40 hover:bg-navy/[0.03]"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function WardrobeConfigurator({
  productId,
  productSlug,
  categorySlug,
  finishes,
  initial,
}: {
  productId?: string;
  productSlug: string;
  categorySlug: string;
  finishes: WardrobeFinish[];
  /** A project opened from a shared link. */
  initial?: Partial<WardrobeProject>;
}) {
  const finishOptions = finishes.length > 0 ? finishes : DEFAULT_FINISHES;

  const [layout, setLayout] = useState<SectionKind[]>(() => initial?.layout ?? PRESETS[0].build(6));
  const [preset, setPreset] = useState<string | null>(initial?.layout ? null : "classic");
  const [finish, setFinish] = useState<string>(
    finishOptions.find((f) => f.id === initial?.finish)?.id ?? finishOptions[0].id
  );
  const [view, setView] = useState<View>("facade");
  const [mirror, setMirror] = useState<MirrorId>(initial?.mirror ?? "center");
  const [rails, setRails] = useState(initial?.rails ?? true);
  const [handle, setHandle] = useState<HandleId>(initial?.handle ?? "накладные");
  const [hinge, setHinge] = useState<(typeof HINGES)[number]["id"]>(initial?.hinge ?? "blum");
  const [niche, setNiche] = useState("");
  const [copied, setCopied] = useState(false);
  const [openDoors, setOpenDoors] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState("Не удалось отправить заявку. Попробуйте ещё раз.");
  const [status, setStatus] = useState<"idle" | "submitting" | "submitted" | "error">("idle");

  const modules = layout.length;
  const widthMm = modules * MODULE_WIDTH_MM;
  const widthM = widthMm / 1000;
  const finishOption = finishOptions.find((f) => f.id === finish) ?? finishOptions[0];
  const handleOption = HANDLES.find((h) => h.id === handle)!;
  const hingeLabel = HINGES.find((h) => h.id === hinge)!.label;
  const mirrorCount = mirrorDoors(modules, mirror).size;

  const counts = useMemo(() => {
    const drawers = layout.filter((k) => k === "drawers").length * 3;
    const rods = layout.filter((k) => k === "hanging" || k === "combo").length;
    const shelves = layout.reduce((sum, k) => sum + SHELVES_IN[k], 0);
    return { drawers, rods, shelves, hinges: modules * HINGES_PER_DOOR };
  }, [layout, modules]);

  function setModuleCount(next: number) {
    const n = Math.max(MIN_MODULES, Math.min(MAX_MODULES, next));
    if (n === modules) return;
    const base = PRESETS.find((p) => p.id === preset)?.build(n);
    setLayout(base ?? Array.from({ length: n }, (_, i) => layout[i] ?? (i % 2 ? "hanging" : "shelves")));
    setOpenDoors(new Set());
    setSelected(null);
  }

  function applyPreset(id: string) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPreset(id);
    setLayout(p.build(modules));
  }

  function setSection(i: number, kind: SectionKind) {
    setLayout((l) => l.map((k, j) => (j === i ? kind : k)));
    setPreset(null);
  }

  function toggleDoor(i: number) {
    setOpenDoors((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  const allOpen = openDoors.size === modules;

  const projectQuery = encodeProject({ layout, finish, mirror, rails, handle, hinge });

  // Keeps the address bar on the current project, so a reload or a copied
  // link brings back exactly this wardrobe.
  useEffect(() => {
    const url = `${window.location.pathname}?${projectQuery}`;
    window.history.replaceState(window.history.state, "", url);
  }, [projectQuery]);

  function projectUrl() {
    return `${window.location.origin}${window.location.pathname}?${projectQuery}`;
  }

  async function shareProject() {
    const url = projectUrl();
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: "Мой шкаф — Molly Home", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // The share sheet was dismissed or the clipboard is blocked — nothing to do.
    }
  }

  const nicheMm = Number(niche.replace(/\D/g, ""));
  const nicheFit = nicheMm >= 300 ? fitNiche(nicheMm, MODULE_WIDTH_MM) : null;

  const specRows: [string, string][] = [
    ["Общая ширина", `${widthMm} мм`],
    ["Общая высота", `${HEIGHT_MM} мм`],
    ["Глубина", `${DEPTH_MM} мм`],
    ["Фасады", `${modules} шт. × ${MODULE_WIDTH_MM} мм`],
    ["Петли", `${hingeLabel}, ${counts.hinges} шт. (${HINGES_PER_DOOR} на фасад)`],
    ["Полки", `${counts.shelves} шт., ЛДСП 16 мм`],
    ["Ящики", counts.drawers ? `${counts.drawers} шт. × ${DRAWER_HEIGHT_MM} мм` : "нет"],
    ["Штанги", counts.rods ? `${counts.rods} шт., хром Ø25 мм` : "нет"],
    ["Отделка фасада", `${finishOption.label}${finishOption.ral ? ` · ${finishOption.ral}` : ""}`],
    ["Зеркало", mirrorCount ? `4 мм, на ${mirrorCount} фасад${mirrorCount === 1 ? "е" : "ах"}` : "нет"],
    ["Декоративные рейки", rails ? "МДФ 8 мм, крашеные" : "нет"],
    ["Ручки", `${handleOption.label} (${handleOption.note.toLowerCase()})`],
  ];

  const specLines = [
    `Ширина: ${modules} модулей × ${MODULE_WIDTH_MM} мм = ${widthMm} мм (${widthM.toFixed(2)} м)`,
    `Высота: ${HEIGHT_MM} мм`,
    `Глубина: ${DEPTH_MM} мм`,
    `Секции: ${layout.map((k, i) => `${i + 1} — ${SECTIONS[k].label.toLowerCase()}`).join(", ")}`,
    `Отделка фасада: ${finishOption.label}${finishOption.ral ? ` (${finishOption.ral})` : ""}`,
    `Зеркало: ${mirrorCount ? `на ${mirrorCount} фасад.` : "нет"}`,
    `Декоративные рейки: ${rails ? "да" : "нет"}`,
    `Ручки: ${handleOption.label}`,
    `Петли: ${hingeLabel}`,
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    try {
      const projectNote = `Проект в конфигураторе: ${projectUrl()}`;
      const result = await submitRequest(name, phone, comment ? `${comment}\n\n${projectNote}` : projectNote, [
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
      if (!result.ok) {
        setError(result.error);
        setStatus("error");
        return;
      }
      setOrderNumber(result.orderNumber);
      setStatus("submitted");
      reachGoal("request_submit", { source: "configurator" });
    } catch {
      setError("Не удалось отправить заявку. Попробуйте ещё раз.");
      setStatus("error");
    }
  }

  if (status === "submitted") {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <span className="mx-auto flex h-20 w-20 animate-fade-up items-center justify-center rounded-full bg-sage-light text-sage">
          <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight text-navy">Заявка отправлена</h1>
        {orderNumber && (
          <p className="mt-2 text-sm font-medium text-navy/50">
            Номер заявки: <span className="text-navy">{orderNumber}</span>
          </p>
        )}
        <p className="mt-3 text-sm text-navy/70">
          Спасибо{name ? `, ${name}` : ""}! Мы получили конфигурацию шкафа и свяжемся с вами по
          телефону {phone}, чтобы уточнить детали, стоимость и записать на замер.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a href={buildStatusDeepLink(phone)} target="_blank" rel="noopener noreferrer" className="btn bg-[#2AABEE] text-white">
            Статус заявки в Telegram
          </a>
          <Link href="/" className="btn btn-outline">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  const selectedKind = selected !== null ? layout[selected] : null;

  return (
    <div className="pb-16">
      <div className="hidden px-4 print:block">
        <p className="font-heading text-2xl font-bold text-navy">Molly Home — шкаф по вашей конфигурации</p>
        <p className="mt-1 text-sm text-navy/60">
          {widthMm} × {HEIGHT_MM} × {DEPTH_MM} мм · molly.uz/configurator/shkaf
        </p>
      </div>

      {/* Title */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 print:hidden">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-navy px-6 py-10 text-white sm:px-12">
          <div aria-hidden className="absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-clay/30 blur-3xl" />
          <div aria-hidden className="absolute -bottom-32 left-1/3 -z-10 h-72 w-72 rounded-full bg-sage/25 blur-3xl" />
          <nav className="flex items-center gap-1.5 text-xs text-white/60">
            <Link href="/" className="transition hover:text-white">Главная</Link>
            <span aria-hidden>/</span>
            <Link href="/catalog/garderoby" className="transition hover:text-white">Гардеробы</Link>
            <span aria-hidden>/</span>
            <span className="text-white">Конфигуратор</span>
          </nav>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <span className="eyebrow text-cream">Онлайн-конфигуратор</span>
              <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-5xl">Соберите свой шкаф</h1>
              <p className="mt-3 text-white/70">
                Модули по {MODULE_WIDTH_MM} мм, наполнение каждой секции, цвет, зеркало и фурнитура —
                схема меняется сразу. Готовую конфигурацию отправьте нам, и мы посчитаем точную цену.
              </p>
            </div>
            <div className="flex gap-3">
              {[
                [`${widthMm}`, "мм ширина"],
                [`${modules}`, "фасадов"],
                [`${counts.hinges}`, "петель"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur">
                  <span key={v} className="block animate-fade-in font-heading text-2xl font-bold">{v}</span>
                  <span className="text-xs text-white/60">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-8 grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Stage */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[2rem] bg-cream-light p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
              <div className="inline-flex rounded-full bg-white p-1 shadow-sm">
                {(
                  [
                    ["facade", "Фасад"],
                    ["interior", "Наполнение"],
                    ["side", "Сбоку"],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setView(v);
                      setSelected(null);
                    }}
                    aria-pressed={view === v}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      view === v ? "bg-navy text-white shadow" : "text-navy/60 hover:text-navy"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {view === "facade" && (
                <button
                  type="button"
                  onClick={() => setOpenDoors(allOpen ? new Set() : new Set(layout.map((_, i) => i)))}
                  className="btn btn-outline bg-white px-4 py-2"
                >
                  {allOpen ? "Закрыть двери" : "Открыть двери"}
                </button>
              )}
            </div>

            <div className="mt-4 rounded-3xl bg-white/70 p-3 sm:p-5">
              <WardrobeDrawing
                view={view}
                layout={layout}
                finish={finishOption.hex}
                mirror={mirror}
                rails={rails}
                handle={handle}
                openDoors={openDoors}
                selected={selected}
                onDoor={toggleDoor}
                onSection={(i) => setSelected(i === selected ? null : i)}
              />
            </div>

            {view === "interior" && selectedKind && selected !== null ? (
              <div key={selected} className="mt-4 animate-fade-up rounded-3xl bg-white p-4 shadow-lg shadow-navy/5">
                <p className="text-sm font-semibold text-navy">
                  Секция {selected + 1} <span className="font-normal text-navy/50">· {SECTIONS[selectedKind].hint}</span>
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {SECTION_ORDER.map((k) => (
                    <Choice key={k} active={selectedKind === k} onClick={() => setSection(selected, k)} className="px-3 py-2.5 text-center text-xs font-semibold">
                      {SECTIONS[k].label}
                    </Choice>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-center text-xs text-navy/50 print:hidden">
                {view === "facade"
                  ? "Нажмите на фасад, чтобы открыть его и заглянуть внутрь"
                  : view === "interior"
                    ? "Нажмите на секцию, чтобы выбрать её наполнение"
                    : `Глубина ${DEPTH_MM} мм, цоколь ${PLINTH_MM} мм`}
              </p>
            )}
          </div>

          {/* Spec table */}
          <div className="mt-6 overflow-hidden rounded-[2rem] border border-navy/10 bg-white">
            <div className="flex items-center justify-between border-b border-navy/10 px-6 py-4">
              <h2 className="font-heading text-lg font-bold text-navy">Основные размеры</h2>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={shareProject}
                  className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-navy ring-1 ring-navy/15 transition hover:bg-navy hover:text-white hover:ring-navy"
                >
                  {copied ? "Ссылка скопирована ✓" : "Ссылка на проект"}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-navy ring-1 ring-navy/15 transition hover:bg-navy hover:text-white hover:ring-navy"
                >
                  Скачать PDF
                </button>
              </div>
            </div>
            <dl className="grid sm:grid-cols-2">
              {specRows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-navy/5 px-6 py-3 text-sm sm:odd:border-r">
                  <dt className="text-navy/55">{k}</dt>
                  <dd key={v} className="animate-fade-in text-right font-semibold text-navy">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-6 print:hidden">
          <div className="rounded-[2rem] border border-navy/10 bg-white p-6 shadow-xl shadow-navy/[0.04]">
            <Step
              n={1}
              title="Ширина"
              aside={<span className="font-heading text-lg font-bold text-navy">{widthMm} мм</span>}
            >
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setModuleCount(modules - 1)}
                  disabled={modules <= MIN_MODULES}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-navy/15 text-lg text-navy transition hover:bg-navy hover:text-white disabled:opacity-30"
                  aria-label="Меньше модулей"
                >
                  −
                </button>
                <input
                  type="range"
                  min={MIN_MODULES}
                  max={MAX_MODULES}
                  step={1}
                  value={modules}
                  onChange={(e) => setModuleCount(Number(e.target.value))}
                  aria-label="Количество модулей"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => setModuleCount(modules + 1)}
                  disabled={modules >= MAX_MODULES}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-navy/15 text-lg text-navy transition hover:bg-navy hover:text-white disabled:opacity-30"
                  aria-label="Больше модулей"
                >
                  +
                </button>
              </div>
              <p className="mt-3 text-xs text-navy/55">
                {modules} модул{modules < 5 ? "я" : "ей"} по {MODULE_WIDTH_MM} мм · высота {HEIGHT_MM} мм · глубина{" "}
                {DEPTH_MM} мм. Нужен другой размер — подгоним на замере.
              </p>
              <div className="mt-4 rounded-2xl bg-cream-light p-4">
                <label className="flex items-center justify-between gap-3 text-sm font-medium text-navy">
                  Подобрать по ширине ниши
                  <span className="flex items-center gap-2">
                    <input
                      inputMode="numeric"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value.replace(/\D/g, "").slice(0, 5))}
                      placeholder="2400"
                      aria-label="Ширина ниши в миллиметрах"
                      className="input w-24 rounded-xl py-2 text-right"
                    />
                    <span className="text-xs text-navy/50">мм</span>
                  </span>
                </label>
                {nicheFit && (
                  <div key={nicheMm} className="mt-3 flex animate-fade-in flex-wrap items-center justify-between gap-3 text-xs text-navy/65">
                    <span>
                      {nicheFit.fits
                        ? `Поместится ${nicheFit.modules} модул${nicheFit.modules < 5 ? "я" : "ей"} — ${nicheFit.modules * MODULE_WIDTH_MM} мм${
                            nicheFit.leftoverMm > 0 ? `, остаток ${nicheFit.leftoverMm} мм закроем доборной планкой` : ""
                          }.`
                        : "Ниша уже двух модулей — подберём решение на замере."}
                    </span>
                    {nicheFit.fits && nicheFit.modules !== modules && (
                      <button
                        type="button"
                        onClick={() => setModuleCount(nicheFit.modules)}
                        className="rounded-full bg-navy px-3.5 py-1.5 font-semibold text-white transition hover:bg-navy-light"
                      >
                        Применить
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Step>

            <Step n={2} title="Наполнение">
              <div className="grid grid-cols-3 gap-2">
                {PRESETS.map((p) => (
                  <Choice key={p.id} active={preset === p.id} onClick={() => applyPreset(p.id)} className="px-3 text-center text-xs font-semibold">
                    {p.label}
                  </Choice>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setView("interior");
                  setSelected(0);
                }}
                className="mt-3 text-sm font-medium text-clay underline-offset-4 hover:underline"
              >
                Настроить каждую секцию на схеме →
              </button>
            </Step>

            <Step
              n={3}
              title="Цвет фасада"
              aside={<span className="text-xs text-navy/50">{finishOption.ral}</span>}
            >
              <div className="flex flex-wrap gap-3">
                {finishOptions.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFinish(f.id)}
                    title={f.ral ? `${f.label} (${f.ral})` : f.label}
                    aria-pressed={finish === f.id}
                    className="group flex flex-col items-center gap-1.5"
                  >
                    <span
                      className={`h-12 w-12 rounded-full shadow-inner transition duration-300 ${
                        finish === f.id ? "ring-2 ring-navy ring-offset-2" : "ring-1 ring-navy/15 group-hover:scale-110"
                      }`}
                      style={{ backgroundColor: f.hex }}
                    />
                    <span className={`text-[11px] ${finish === f.id ? "font-semibold text-navy" : "text-navy/55"}`}>{f.label}</span>
                  </button>
                ))}
              </div>
            </Step>

            <Step n={4} title="Зеркало">
              <div className="grid grid-cols-3 gap-2">
                {MIRRORS.map((m) => (
                  <Choice key={m.id} active={mirror === m.id} onClick={() => setMirror(m.id)} className="px-3 text-center text-xs font-semibold">
                    {m.label}
                  </Choice>
                ))}
              </div>
            </Step>

            <Step
              n={5}
              title="Декоративные рейки"
              aside={
                <button
                  type="button"
                  role="switch"
                  aria-checked={rails}
                  onClick={() => setRails((v) => !v)}
                  className={`relative h-7 w-12 rounded-full transition ${rails ? "bg-clay" : "bg-navy/15"}`}
                >
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${rails ? "left-6" : "left-1"}`} />
                </button>
              }
            >
              <p className="text-xs text-navy/55">Три вертикальные рейки из МДФ 8 мм в цвет фасада — на всех фасадах без зеркала.</p>
            </Step>

            <Step n={6} title="Ручки">
              <div className="grid grid-cols-3 gap-2">
                {HANDLES.map((h) => (
                  <Choice key={h.id} active={handle === h.id} onClick={() => setHandle(h.id)} className="px-3">
                    <span className="block text-xs font-semibold">{h.label}</span>
                    <span className={`mt-0.5 block text-[11px] ${handle === h.id ? "text-white/65" : "text-navy/50"}`}>{h.note}</span>
                  </Choice>
                ))}
              </div>
            </Step>

            <Step n={7} title="Петли" aside={<span className="text-xs text-navy/50">{HINGES_PER_DOOR} на фасад</span>}>
              <div className="grid grid-cols-2 gap-2">
                {HINGES.map((h) => {
                  const badge = getHardwareBrandBadge(h.id, h.label);
                  return (
                    <Choice key={h.id} active={hinge === h.id} onClick={() => setHinge(h.id)} className="flex items-center gap-3">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: badge.bg, color: badge.fg }}
                      >
                        {badge.letter}
                      </span>
                      <span className="font-semibold">{h.label}</span>
                    </Choice>
                  );
                })}
              </div>
            </Step>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-[2rem] bg-navy p-6 text-white sm:p-7">
            <div>
              <h3 className="font-heading text-xl font-bold">Отправить конфигурацию</h3>
              <p className="mt-1 text-sm text-white/60">
                Менеджер посчитает стоимость и согласует бесплатный замер.
              </p>
            </div>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input rounded-xl py-3"
              placeholder="Ваше имя"
              aria-label="Имя"
            />
            <PhoneInput required value={phone} onChange={setPhone} />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="input rounded-xl py-3"
              placeholder="Комментарий: адрес, удобное время звонка"
              aria-label="Комментарий"
            />
            {status === "error" && <p className="text-sm font-medium text-red-300">{error}</p>}
            <button type="submit" disabled={status === "submitting"} className="btn btn-light py-3.5 disabled:opacity-60">
              {status === "submitting" ? "Отправляем…" : "Отправить заявку"}
            </button>
            <p className="-mt-1 text-xs text-white/45">
              Отправляя заявку, вы соглашаетесь с{" "}
              <Link href="/privacy" className="underline hover:text-white">
                политикой конфиденциальности
              </Link>
              .
            </p>
          </form>
        </div>
      </div>

      {/* Technical details from the production drawings */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 print:hidden">
        <span className="eyebrow">Как устроен шкаф</span>
        <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-navy">Технические узлы</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-navy/10 bg-white p-6">
            <svg viewBox="0 0 120 240" className="mx-auto h-40" aria-hidden>
              <rect x={30} y={10} width={60} height={220} rx={4} fill="#eadfce" stroke="#c4b098" strokeWidth={2} />
              {[20, 83, 147, 210].map((y) => (
                <g key={y}>
                  <rect x={24} y={y - 5} width={18} height={10} rx={3} fill="#a9aeb6" />
                  <circle cx={36} cy={y} r={5} fill="#7d838c" />
                </g>
              ))}
              <text x={100} y={52} fontSize={10} fill="#56617a">700</text>
              <text x={100} y={118} fontSize={10} fill="#56617a">700</text>
              <text x={100} y={182} fontSize={10} fill="#56617a">700</text>
            </svg>
            <h3 className="mt-4 font-heading text-base font-bold text-navy">4 петли на фасад</h3>
            <p className="mt-1 text-sm text-navy/60">
              100 мм от края и шаг 700 мм — фасад высотой 2,2 м не проседает. Blum или Higold на выбор.
            </p>
          </div>
          <div className="rounded-3xl border border-navy/10 bg-white p-6">
            <div className="flex h-40 items-center justify-center gap-1">
              {[0, 1, 2].map((k) => (
                <div key={k} className="h-32 w-14 rounded-md bg-cream shadow-inner ring-1 ring-navy/10" />
              ))}
            </div>
            <h3 className="mt-4 font-heading text-base font-bold text-navy">Зазоры 2 мм</h3>
            <p className="mt-1 text-sm text-navy/60">
              Ровные технологические зазоры между фасадами и цоколь 100 мм снизу.
            </p>
          </div>
          <div className="rounded-3xl border border-navy/10 bg-white p-6">
            <div className="flex h-40 flex-col justify-center gap-2 px-4">
              {[
                ["Корпус", "ЛДСП 16 мм"],
                ["Фасады", "МДФ 18 мм, крашеные"],
                ["Задняя стенка", "ХДФ 3 мм, в паз"],
                ["Рейки", "МДФ 8 мм"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2 rounded-xl bg-cream-light px-3 py-1.5 text-xs">
                  <span className="text-navy/55">{k}</span>
                  <span className="font-semibold text-navy">{v}</span>
                </div>
              ))}
            </div>
            <h3 className="mt-4 font-heading text-base font-bold text-navy">Материалы</h3>
            <p className="mt-1 text-sm text-navy/60">Крашеный МДФ на фасадах и влагостойкий корпус.</p>
          </div>
          <div className="rounded-3xl border border-navy/10 bg-white p-6">
            <svg viewBox="0 0 160 160" className="mx-auto h-40" aria-hidden>
              <rect x={20} y={30} width={120} height={8} rx={4} fill="url(#chrome-mini)" />
              <defs>
                <linearGradient id="chrome-mini" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f4f5f7" />
                  <stop offset="50%" stopColor="#a9aeb6" />
                  <stop offset="100%" stopColor="#e1e3e7" />
                </linearGradient>
              </defs>
              {[0, 1, 2].map((k) => (
                <rect key={k} x={24} y={96 + k * 20} width={112} height={16} rx={3} fill="#e3d6c5" stroke="#c4b098" />
              ))}
              <text x={80} y={62} fontSize={11} textAnchor="middle" fill="#56617a">1700 мм от пола</text>
            </svg>
            <h3 className="mt-4 font-heading text-base font-bold text-navy">Штанги и ящики</h3>
            <p className="mt-1 text-sm text-navy/60">
              Хромированная штанга Ø25 мм, ящики по 200 мм на направляющих полного выдвижения.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
