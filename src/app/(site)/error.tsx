"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Storefront page failed", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="font-heading text-2xl font-bold text-navy">
        Страница не загрузилась
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-navy/60">
        Что-то пошло не так на нашей стороне. Попробуйте обновить — если не
        поможет, позвоните нам, и мы примем заявку по телефону.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy/90"
        >
          Обновить
        </button>
        <Link
          href="/"
          className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-medium text-navy transition hover:bg-navy/5"
        >
          На главную
        </Link>
        <Link
          href="/contacts"
          className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-medium text-navy transition hover:bg-navy/5"
        >
          Связаться
        </Link>
      </div>
      {error.digest && (
        <p className="mt-8 font-mono text-[11px] text-navy/30">
          Код ошибки: {error.digest}
        </p>
      )}
    </div>
  );
}
