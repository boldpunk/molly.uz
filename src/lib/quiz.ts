import type { Product } from "./types";

export type Room = "kitchen" | "wardrobe" | "bedroom" | "living";
export type Mood = "light" | "wood" | "dark" | "accent";

export const ROOMS: { id: Room; label: string; note: string; categories: string[] }[] = [
  { id: "kitchen", label: "Кухня", note: "под размер вашей комнаты", categories: ["kuhonnaya-mebel"] },
  { id: "wardrobe", label: "Шкаф или гардероб", note: "хранение без хаоса", categories: ["garderoby"] },
  { id: "bedroom", label: "Спальня", note: "кровать и гарнитур", categories: ["krovati", "spalnye-garnitury"] },
  { id: "living", label: "Гостиная", note: "диваны и мягкая мебель", categories: ["myagkaya-mebel"] },
];

export const MOODS: { id: Mood; label: string; note: string; colours: string[] }[] = [
  { id: "light", label: "Светло и воздушно", note: "белый, молочный, бежевый", colours: ["#f4efe8", "#e6dccd", "#cfc4b4"] },
  { id: "wood", label: "Тёплое дерево", note: "дуб, орех, натуральные фактуры", colours: ["#c9a27a", "#a87c55", "#7a5a3c"] },
  { id: "dark", label: "Глубоко и графично", note: "графит, антрацит, чёрный", colours: ["#5b5f66", "#3a3d42", "#1f2023"] },
  { id: "accent", label: "С характером", note: "шалфей, терракота, цвет", colours: ["#9bab8f", "#c2714f", "#6f8aa0"] },
];

export const SIZES = [
  { id: "compact", label: "Компактное", note: "до 10 м²" },
  { id: "medium", label: "Среднее", note: "10–20 м²" },
  { id: "large", label: "Просторное", note: "больше 20 м²" },
] as const;

export const TIMING = [
  { id: "now", label: "В ближайший месяц", note: "готов(а) к замеру" },
  { id: "soon", label: "Через 1–3 месяца", note: "идёт ремонт" },
  { id: "browsing", label: "Пока присматриваюсь", note: "собираю идеи" },
] as const;

/** Sorts a swatch colour into one of the quiz moods. */
export function moodOf(hex: string): Mood | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
    if (h < 0) h += 360;
  }

  if (l < 0.32) return "dark";
  if (l > 0.8) return "light";
  if (s < 0.14) return l < 0.5 ? "dark" : "light";
  if (h >= 18 && h <= 50 && s < 0.75) return l > 0.72 ? "light" : "wood";
  return "accent";
}

/** The products that best fit the answers, most fitting first. */
export function recommend(products: Product[], room: Room, mood: Mood | null, limit = 4): Product[] {
  const categories = ROOMS.find((r) => r.id === room)?.categories ?? [];
  const scored = products
    .filter((p) => categories.includes(p.categorySlug))
    .map((p) => {
      const moods = (p.colourOptions ?? []).map((c) => moodOf(c.swatch)).filter(Boolean);
      const match = mood && moods.length ? moods.filter((x) => x === mood).length / moods.length : 0;
      return { p, score: match + (p.isFeatured ? 0.15 : 0) + (p.imageUrl ? 0.05 : 0) };
    });
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.p);
}
