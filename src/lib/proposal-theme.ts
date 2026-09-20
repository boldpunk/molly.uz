export interface ProposalTheme {
  id: string;
  label: string;
  color: string;
}

export const PROPOSAL_THEMES: ProposalTheme[] = [
  { id: "gold", label: "Золотой", color: "#C08A2E" },
  { id: "navy", label: "Тёмно-синий", color: "#182B4C" },
  { id: "terracotta", label: "Терракота", color: "#C05A3E" },
  { id: "forest", label: "Изумрудный", color: "#2F6B4F" },
  { id: "graphite", label: "Графит", color: "#3A3A3C" },
  { id: "plum", label: "Слива", color: "#6B3F69" },
];

export const DEFAULT_THEME_COLOR = PROPOSAL_THEMES[0].color;

export function normalizeHex(input: string): string {
  const value = input.trim();
  const short = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
  if (short) {
    return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toUpperCase();
  }
  const full = /^#?([0-9a-f]{6})$/i.exec(value);
  if (full) return `#${full[1]}`.toUpperCase();
  return DEFAULT_THEME_COLOR;
}

function channels(hex: string): [number, number, number] {
  const value = normalizeHex(hex).slice(1);
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

function relativeLuminance(hex: string): number {
  const srgb = channels(hex).map((c) => {
    const channel = c / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

// Text printed on top of the accent colour (the grand-total block, badges).
// Dark accents get white text, light ones get near-black, so a manager
// picking a pale custom hex can't produce an unreadable document.
export function contrastText(hex: string): string {
  return relativeLuminance(hex) > 0.45 ? "#1A1A1A" : "#FFFFFF";
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = channels(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// A deepened accent for small text on white, where a pale accent would fail
// contrast on its own.
export function readableAccent(hex: string): string {
  const [r, g, b] = channels(hex);
  if (relativeLuminance(hex) <= 0.45) return normalizeHex(hex);
  const darken = (c: number) => Math.round(c * 0.62);
  return `#${[darken(r), darken(g), darken(b)]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}
