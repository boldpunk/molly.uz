/* eslint-disable @next/next/no-img-element */

import { MollyWordmark, type BrandTone } from "@/components/brand/molly-wordmark";

// Brand book minimum width on screen is 160px — below that HOME stops being
// readable, so callers pass a width rather than a font size.
const MIN_WIDTH_PX = 160;

export function Logo({
  width = MIN_WIDTH_PX,
  tone = "navy",
  src,
  className = "",
}: {
  width?: number;
  tone?: BrandTone;
  /** Administrator-uploaded override; falls back to the built-in wordmark. */
  src?: string | null;
  className?: string;
}) {
  const style = { width: Math.max(width, MIN_WIDTH_PX), height: "auto" };

  if (src) {
    return (
      <img
        src={src}
        alt="Molly Home"
        style={style}
        className={`block ${className}`}
      />
    );
  }

  return (
    <MollyWordmark tone={tone} style={style} className={`block ${className}`} />
  );
}
