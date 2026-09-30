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
    <footer className="relative mt-16 overflow-hidden bg-navy text-cream">
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
        <div>
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
              <a
                href="https://t.me/mollyhomeuzbot"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-cream/10 px-3 py-1.5 font-medium text-cream transition hover:bg-cream hover:text-navy"
              >
                Проверить заявку в Telegram
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
