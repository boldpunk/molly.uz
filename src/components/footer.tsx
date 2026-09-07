import Link from "next/link";
import { categories } from "@/lib/data";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-navy/10 bg-navy text-cream">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
        <div>
          <span className="font-heading text-lg font-bold">MOLLY HOME</span>
          <p className="mt-3 text-sm text-cream/70">
            Производитель комфортной мебели для дома. Современные технологии,
            лояльный бренд.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cream/50">
            Каталог
          </h3>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link href={`/catalog/${cat.slug}`} className="hover:underline">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cream/50">
            Компания
          </h3>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            <li>
              <Link href="/about" className="hover:underline">
                О бренде
              </Link>
            </li>
            <li>
              <Link href="/delivery" className="hover:underline">
                Доставка и оплата
              </Link>
            </li>
            <li>
              <Link href="/contacts" className="hover:underline">
                Контакты
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-cream/50">
            Связь
          </h3>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            <li>
              <a href="tel:+998000000000" className="hover:underline">
                +998 00 000 00 00
              </a>
            </li>
            <li>
              <a
                href="https://t.me/mollyhome"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:underline"
              >
                Проверить заявку в Telegram
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10 px-6 py-4 text-center text-xs text-cream/50">
        © {new Date().getFullYear()} Molly Home
      </div>
    </footer>
  );
}
