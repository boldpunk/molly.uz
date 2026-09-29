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
      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-2 border-t border-cream/10 px-6 py-5 text-xs text-cream/45 sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} Molly Home</span>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="transition hover:text-white">
            Политика конфиденциальности
          </Link>
          <Link href="/terms" className="transition hover:text-white">
            Условия использования
          </Link>
        </div>
        <span>Сделано с ❤️ от @boldpunk</span>
      </div>
    </footer>
  );
}
