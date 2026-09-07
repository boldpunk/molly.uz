interface BrandStyle {
  bg: string;
  fg: string;
}

const BRAND_STYLES: Record<string, BrandStyle> = {
  higold: { bg: "#00A0DC", fg: "#ffffff" },
  blum: { bg: "#F26522", fg: "#ffffff" },
  hettich: { bg: "#D71920", fg: "#ffffff" },
  hafele: { bg: "#2B2B2E", fg: "#ffffff" },
};

const FALLBACK_STYLE: BrandStyle = { bg: "#182b4c", fg: "#ffffff" };

const ABBREVIATIONS: Record<string, string> = {
  higold: "HI",
  blum: "BL",
  hettich: "HE",
  hafele: "HA",
};

export function getHardwareBrandBadge(id: string, label: string) {
  const key = id.toLowerCase();
  const style = BRAND_STYLES[key] ?? FALLBACK_STYLE;
  return {
    letter: ABBREVIATIONS[key] ?? label.trim().slice(0, 2).toUpperCase(),
    ...style,
  };
}
