"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

export const YM_ID = Number(process.env.NEXT_PUBLIC_YM_ID ?? 113227850);

type Ym = (id: number, method: string, ...args: unknown[]) => void;

function ym(method: string, ...args: unknown[]) {
  const fn = (window as unknown as { ym?: Ym }).ym;
  if (fn) fn(YM_ID, method, ...args);
}

/** Sends a Metrika goal; a no-op before the counter has loaded. */
export function reachGoal(goal: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  ym("reachGoal", goal, params);
}

// The App Router swaps pages client-side, so Metrika only sees the first
// load on its own — report every later navigation as a hit.
function RouteHits() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    const url = window.location.href;
    if (previous.current && previous.current !== url) {
      ym("hit", url, { referer: previous.current, title: document.title });
    }
    previous.current = url;
  }, [pathname, searchParams]);

  return null;
}

export function YandexMetrika() {
  if (!YM_ID) return null;
  return (
    <>
      <Script id="ym-init" strategy="afterInteractive">
        {`
          (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
          (window, document, "script", "https://mc.yandex.ru/metrika/tag.js?id=${YM_ID}", "ym");
          ym(${YM_ID}, "init", {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
        `}
      </Script>
      <noscript>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://mc.yandex.ru/watch/${YM_ID}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
      <Suspense fallback={null}>
        <RouteHits />
      </Suspense>
    </>
  );
}
