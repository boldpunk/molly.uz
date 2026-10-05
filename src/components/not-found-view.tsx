import Link from "next/link";
import { getFeaturedProducts } from "@/lib/data";
import { ProductCard } from "./product-card";
import { NotFoundWardrobe } from "./not-found-wardrobe";

export async function NotFoundView() {
  const featured = (await getFeaturedProducts().catch(() => [])).slice(0, 4);

  return (
    <div className="overflow-x-clip">
      <section className="relative isolate mx-auto grid max-w-7xl items-center gap-12 px-6 py-14 sm:py-20 lg:grid-cols-[1fr_1.05fr]">
        <div aria-hidden className="absolute -left-24 top-10 -z-10 h-72 w-72 rounded-full bg-cream blur-3xl" />
        <div className="animate-fade-up">
          <span className="eyebrow">Ошибка 404</span>
          <h1 className="mt-4 font-heading text-4xl font-bold leading-[1.05] tracking-tight text-navy sm:text-6xl">
            Эту страницу
            <br />
            ещё не собрали
          </h1>
          <p className="mt-5 max-w-md text-navy/65">
            Ссылка устарела или в адресе опечатка. Зато в шкафу рядом — всё, что есть на сайте:
            откройте любую дверцу или поищите модель.
          </p>

          <form action="/search" className="mt-8 flex max-w-md items-center gap-2 rounded-full bg-white py-1.5 pl-5 pr-1.5 shadow-lg shadow-navy/5 ring-1 ring-navy/10 focus-within:ring-navy/30">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-navy/40" aria-hidden>
              <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm10 3-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              name="q"
              placeholder="Кухня, диван, шкаф…"
              aria-label="Поиск по каталогу"
              className="w-full bg-transparent py-2 text-sm text-navy outline-none placeholder:text-navy/40"
            />
            <button type="submit" className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-light">
              Найти
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            {[
              ["/podbor", "Подбор за минуту"],
              ["/request", "Бесплатный замер"],
              ["/contacts", "Контакты"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="rounded-full px-4 py-2 font-medium text-navy ring-1 ring-navy/15 transition hover:bg-navy hover:text-white">
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="animate-fade-up [animation-delay:150ms]">
          <NotFoundWardrobe />
        </div>
      </section>

      {featured.length > 0 && (
        <section className="bg-cream-light/70 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-navy sm:text-3xl">
                Пока вы здесь — модели, которые выбирают
              </h2>
              <Link href="/catalog" className="btn btn-outline">
                Весь каталог
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} hideFeaturedBadge />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
