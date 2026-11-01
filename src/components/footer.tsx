import Link from "next/link";
import { Category } from "@/lib/types";
import { Logo } from "@/components/logo";

export function Footer({
  categories,
  phone,
  logoSrc,
  logoScale,
}: {
  categories: Category[];
  phone: string;
  /** The reversed (cream) logo — the footer sits on navy. */
  logoSrc?: string | null;
  logoScale?: number;
}) {
  return (
    <footer className="relative mt-16 print:hidden overflow-hidden bg-navy text-cream">
      <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-clay/15 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-14 md:grid-cols-4">
        <div>
          <Logo width={176} tone="cream" src={logoSrc} scale={logoScale} />
          <p className="mt-4 text-sm text-cream/60">
            Производитель комфортной мебели для дома. Современные технологии,
            лояльный бренд.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
            Каталог
          </h3>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm text-cream/75">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link href={`/catalog/${cat.slug}`} className="transition hover:text-white">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
            Компания
          </h3>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm text-cream/75">
            <li>
              <Link href="/podbor" className="transition hover:text-white">
                Подбор за минуту
              </Link>
            </li>
            <li>
              <Link href="/configurator/shkaf" className="transition hover:text-white">
                Конфигуратор шкафа
              </Link>
            </li>
            <li>
              <Link href="/about" className="transition hover:text-white">
                О бренде
              </Link>
            </li>
            <li>
              <Link href="/delivery" className="transition hover:text-white">
                Доставка и оплата
              </Link>
            </li>
            <li>
              <Link href="/contacts" className="transition hover:text-white">
                Контакты
              </Link>
            </li>
          </ul>
        </div>
        {/* Full width on phones so the Telegram card has room for one line. */}
        <div className="col-span-2 md:col-span-1">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-clay">
            Связь
          </h3>
          <ul className="mt-4 flex flex-col gap-2.5 text-sm text-cream/75">
            <li>
              <a
                href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                className="transition hover:text-white"
              >
                {phone}
              </a>
            </li>
            <li>
              {/* A two-line card rather than a pill: the label wraps in the
                  narrow phone column and a wrapped pill looks broken. */}
              <a
                href="https://t.me/mollyhomeuzbot"
                target="_blank"
                rel="noreferrer"
                className="group mt-1 flex max-w-xs items-center gap-3 rounded-2xl bg-cream/[0.08] p-3 ring-1 ring-cream/10 transition hover:bg-cream hover:ring-cream"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2AABEE] text-white">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 -translate-x-px" aria-hidden>
                    <path fill="currentColor" d="M21.4 4.6 2.9 11.7c-1.3.5-1.2 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.8-.4l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.8-1.3-1.5Zm-3.9 3.6-8.9 8-.3 3.4-1.4-4.6 10.3-6.5c.5-.3.8-.1.3.2Z" />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block whitespace-nowrap text-sm font-semibold text-cream transition group-hover:text-navy">Статус заявки</span>
                  <span className="block whitespace-nowrap text-xs text-cream/55 transition group-hover:text-navy/60">в Telegram-боте</span>
                </span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-4 border-t border-cream/10 px-6 pb-24 pt-5 text-xs text-cream/45 md:flex-row md:justify-between md:pb-5">
        <span className="text-[13px] text-cream/55">© {new Date().getFullYear()} Molly Home</span>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 whitespace-nowrap">
          <Link href="/privacy" className="transition hover:text-white">
            Политика конфиденциальности
          </Link>
          <Link href="/terms" className="transition hover:text-white">
            Условия использования
          </Link>
        </div>
        <a
          href="https://boldstudio.uz"
          target="_blank"
          rel="noopener"
          className="group inline-flex items-center gap-2.5 whitespace-nowrap rounded-full border border-cream/15 bg-white/[0.03] py-2 pl-4 pr-3 text-[13px] text-cream/85 transition hover:border-cream/35 hover:bg-white/[0.06]"
        >
          <span>Дизайн и разработка —</span>
          <span className="font-semibold text-[#c8f135]">@boldpunk</span>
          <span className="hidden font-mono text-[12px] text-cream/45 sm:inline">boldstudio.uz</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className="h-3.5 w-3.5 text-cream/70 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
          >
            <path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </footer>
  );
}
