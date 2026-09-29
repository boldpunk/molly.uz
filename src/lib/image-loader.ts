"use client";

// Every next/image goes through /api/img (see app/api/img/route.ts), which
// serves a WebP of just the width the layout needs. Vector and inline images
// are already as small as they get and pass through untouched.
const QUALITIES = [60, 75, 85];

export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (src.startsWith("data:") || /\.svg(\?|$)/i.test(src)) return src;
  const q = QUALITIES.reduce((best, v) =>
    Math.abs(v - (quality ?? 75)) < Math.abs(best - (quality ?? 75)) ? v : best
  );
  return `/api/img?src=${encodeURIComponent(src)}&w=${width}&q=${q}`;
}
