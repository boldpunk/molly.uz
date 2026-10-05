// A wardrobe configuration packed into URL search params, so a customer can
// save or share their project and the manager opens exactly what they built.

export type SectionKind = "shelves" | "hanging" | "drawers" | "combo";
export type MirrorId = "none" | "center" | "all";
export type HandleId = "накладные" | "врезные" | "push";
export type HingeId = "blum" | "higold";

export interface WardrobeProject {
  layout: SectionKind[];
  finish?: string;
  mirror: MirrorId;
  rails: boolean;
  handle: HandleId;
  hinge: HingeId;
}

export const MIN_MODULES = 2;
export const MAX_MODULES = 8;

const SECTION_CODES: Record<SectionKind, string> = { shelves: "s", hanging: "h", drawers: "d", combo: "c" };
const HANDLE_CODES: Record<HandleId, string> = { "накладные": "bar", "врезные": "inset", push: "push" };
const MIRRORS: MirrorId[] = ["none", "center", "all"];
const HINGES: HingeId[] = ["blum", "higold"];

function invert<K extends string>(map: Record<K, string>): Record<string, K> {
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k])) as Record<string, K>;
}
const SECTION_BY_CODE = invert(SECTION_CODES);
const HANDLE_BY_CODE = invert(HANDLE_CODES);

export function encodeProject(p: WardrobeProject): string {
  const params = new URLSearchParams();
  params.set("s", p.layout.map((k) => SECTION_CODES[k]).join(""));
  if (p.finish) params.set("f", p.finish);
  params.set("m", p.mirror);
  params.set("r", p.rails ? "1" : "0");
  params.set("h", HANDLE_CODES[p.handle]);
  params.set("g", p.hinge);
  return params.toString();
}

type Params = Record<string, string | string[] | undefined>;

/** Reads a shared project; anything missing or malformed is left out. */
export function decodeProject(params: Params): Partial<WardrobeProject> {
  const one = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };
  const out: Partial<WardrobeProject> = {};

  const s = one("s");
  if (s && s.length >= MIN_MODULES && s.length <= MAX_MODULES && [...s].every((c) => c in SECTION_BY_CODE)) {
    out.layout = [...s].map((c) => SECTION_BY_CODE[c]);
  }
  const f = one("f");
  if (f && f.length <= 64) out.finish = f;
  const m = one("m");
  if (MIRRORS.includes(m as MirrorId)) out.mirror = m as MirrorId;
  const r = one("r");
  if (r === "0" || r === "1") out.rails = r === "1";
  const h = one("h");
  if (h && h in HANDLE_BY_CODE) out.handle = HANDLE_BY_CODE[h];
  const g = one("g");
  if (HINGES.includes(g as HingeId)) out.hinge = g as HingeId;
  return out;
}

/** How many modules fit a niche, and what is left over for the filler strip. */
export function fitNiche(nicheMm: number, moduleMm: number) {
  const raw = Math.floor(nicheMm / moduleMm);
  const modules = Math.max(MIN_MODULES, Math.min(MAX_MODULES, raw));
  return { modules, leftoverMm: nicheMm - modules * moduleMm, fits: raw >= MIN_MODULES };
}
