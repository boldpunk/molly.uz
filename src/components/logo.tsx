/* eslint-disable @next/next/no-img-element */

import { MollyWordmark, type BrandTone } from "@/components/brand/molly-wordmark";

// Brand book minimum width on screen is 160px — below that HOME stops being
// readable, so callers pass a width rather than a font size.
const MIN_WIDTH_PX = 160;

export function Logo({
  width = MIN_WIDTH_PX,
  tone = "navy",
  src,
  scale = 100,
  className = "",
}: {
  width?: number;
  tone?: BrandTone;
  /** Administrator-uploaded override; falls back to the built-in wordmark. */
  src?: string | null;
  /** Site-wide percentage from /admin/brand. */
  scale?: number;
  className?: string;
}) {
  // The brand book's 160px minimum is a readability floor for the wordmark
  // itself; an explicit site-wide scale is the owner overriding that on
  // purpose, so it is applied after the floor rather than clamped by it.
  const style = {
    width: (Math.max(width, MIN_WIDTH_PX) * scale) / 100,
    height: "auto",
  };

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
