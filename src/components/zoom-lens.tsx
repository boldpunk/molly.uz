"use client";

import { useRef, useState } from "react";
import imageLoader from "@/lib/image-loader";

/**
 * Hover magnifier for a product photo on desktop: a 2.2× view of the spot
 * under the cursor, taken from a 1920 px copy that only loads on first hover.
 * Touch screens skip it — a tap opens the full-screen viewer instead.
 */
export function ZoomLens({ src }: { src: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  function move(e: React.PointerEvent) {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    setPos({
      x: Math.min(100, Math.max(0, ((e.clientX - box.left) / box.width) * 100)),
      y: Math.min(100, Math.max(0, ((e.clientY - box.top) / box.height) * 100)),
    });
  }

  return (
    <div
      ref={ref}
      aria-hidden
      onPointerEnter={(e) => e.pointerType === "mouse" && setActive(true)}
      onPointerLeave={() => setActive(false)}
      onPointerMove={(e) => e.pointerType === "mouse" && move(e)}
      className="pointer-events-auto absolute inset-0 hidden md:block"
    >
      {active && (
        <div
          className="absolute inset-0 animate-fade-in bg-cream-light bg-no-repeat"
          style={{
            backgroundImage: `url("${imageLoader({ src, width: 1920, quality: 85 })}")`,
            backgroundSize: "220%",
            backgroundPosition: `${pos.x}% ${pos.y}%`,
          }}
        />
      )}
    </div>
  );
}
