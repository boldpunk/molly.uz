import Image from "next/image";
import Link from "next/link";
import {
  getCategories,
  getFeaturedProducts,
  getPageBySlug,
  getProductsByCategory,
} from "@/lib/data";
import { formatSum } from "@/lib/format";
import { getDisplayPrice } from "@/lib/pricing";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { PlaceholderImage } from "@/components/placeholder-image";
import { getCategoryIcon } from "@/components/icons/categories";
import { UspIcon } from "@/components/usp-icons";
import { Reveal } from "@/components/reveal";
import { PhotoSlider } from "@/components/photo-slider";
import { BrandSlider } from "@/components/brand-slider";
import { ReviewsGrid } from "@/components/reviews-grid";
import { HeroSlider, type HeroSlide } from "@/components/hero-slider";
import { FeaturedProducts } from "@/components/home/featured-products";
import { pageMetadata } from "@/lib/seo";
import { categoryImage } from "@/lib/category-images";
import type { PageBlock } from "@/db/schema";

export const dynamic = "force-dynamic";

const PROCESS_STEPS = [
  {
    icon: "box",
    title: "Заявка",
    text: "Оставляете заявку на сайте, в Telegram или по телефону — менеджер свяжется в течение дня.",
  },
  {
    icon: "ruler",
    title: "Замер",
    text: "Бесплатно выезжаем на объект и снимаем точные размеры под ваше помещение.",
  },
  {
    icon: "wrench",
    title: "Производство",
    text: "Изготавливаем мебель по вашим размерам с выбранной фурнитурой и отделкой.",
  },
  {
    icon: "truck",
    title: "Доставка и монтаж",
    text: "Привозим и собираем мебель на месте — остаётся только пользоваться.",
  },
] as const;

const GALLERY_PHOTOS = [
  { src: "/images/gallery/kitchen-island.jpg", caption: "Кухня" },
  { src: "/images/gallery/reading-nook.jpg", caption: "Гостиная" },
  { src: "/images/gallery/entryway.jpg", caption: "Прихожая" },
  { src: "/images/gallery/office.jpg", caption: "Кабинет" },
];

// Extra hero slides point at sections of the catalogue. Each is shown only
// while its category is live, so the slider never links to an empty page.
const CATEGORY_SLIDES: Record<string, Omit<HeroSlide, "image" | "alt">> = {
  "kuhonnaya-mebel": {
    eyebrow: "Кухни на заказ",
    title: "Кухня, собранная по вашим размерам",
    text: "Фасады МДФ с окраской, влагостойкие корпуса и фурнитура HIGOLD или BLUM. Стоимость — за погонный метр.",
    cta: { label: "Смотреть кухни", href: "/catalog/kuhonnaya-mebel" },
    secondary: { label: "Бесплатный замер", href: "/request" },
  },
  garderoby: {
    eyebrow: "Конфигуратор",
    title: "Соберите свой шкаф онлайн",
    text: "Модули, наполнение, цвет фасада и петли — спецификация готова за пару минут, заявка прямо со страницы.",
    cta: { label: "Собрать шкаф", href: "/configurator/shkaf" },
    secondary: { label: "Гардеробы", href: "/catalog/garderoby" },
  },
  "spalnye-garnitury": {
    eyebrow: "Спальни",
    title: "Спальня, в которой хочется отдыхать",
    text: "Кровати, тумбы и шкафы одной коллекции — спокойные фактуры и продуманное хранение.",
    cta: { label: "Смотреть спальни", href: "/catalog/spalnye-garnitury" },
  },
};

export async function generateMetadata() {
  const home = await getPageBySlug("home");
  const heroImage = home?.blocks?.[2];
  const heroImageUrl =
    heroImage?.type === "image" && heroImage.url ? heroImage.url : "/images/hero.jpg";
  return pageMetadata(
    home,
    "Molly Home — мебель для дома",
    "Molly Home — производитель комфортной мебели для дома. Современные технологии, лояльный бренд.",
    heroImageUrl,
    "/"
  );
}

function pick<T extends PageBlock["type"]>(
  blocks: PageBlock[],
  index: number,
  type: T
): Extract<PageBlock, { type: T }> | undefined {
  const b = blocks[index];
  return b && b.type === type ? (b as Extract<PageBlock, { type: T }>) : undefined;
}

function SectionHeading({
  eyebrow,
  title,
  text,
  light = false,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  light?: boolean;
}) {
  return (
    <div className="max-w-2xl">
      <span className={`eyebrow ${light ? "text-cream" : ""}`}>{eyebrow}</span>
      <h2
        className={`mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl ${
          light ? "text-white" : "text-navy"
        }`}
      >
        {title}
      </h2>
      {text && (
        <p className={`mt-3 text-sm sm:text-base ${light ? "text-white/65" : "text-navy/60"}`}>
          {text}
        </p>
      )}
    </div>
  );
}

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function HomePage() {
  const [categories, featured, home] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
    getPageBySlug("home"),
  ]);

  const blocks = home?.blocks ?? [];
  const heroHeading =
    pick(blocks, 0, "heading")?.text ?? "Мебель для дома, сделанная под вас";
  const heroSubtitle =
    pick(blocks, 1, "paragraph")?.text ??
    "Molly Home — производитель комфортной мебели для дома. Современные технологии, лояльный бренд.";
  const heroImage = pick(blocks, 2, "image");
  const uspStats = pick(blocks, 3, "stat_list")?.items ?? [
    { label: "Высота фасадов", value: "любая под проект", icon: "ruler" },
    { label: "Материал фасада", value: "МДФ, окраска", icon: "layers" },
    { label: "Клеевой состав", value: "влагостойкий", icon: "droplet" },
    { label: "Фурнитура", value: "HIGOLD / BLUM", icon: "wrench" },
  ];
  const brandHeading = pick(blocks, 4, "heading")?.text ?? "О бренде";
  const brandParagraph =
    pick(blocks, 5, "paragraph")?.text ??
    "Molly Home — производитель мебели в Ташкенте. Мы совмещаем современные технологии производства с индивидуальным подходом к каждому заказу — от кухни по размерам вашей комнаты до готовых моделей спален и гардеробов.";
  const brandImage = pick(blocks, 6, "image");
  const instagramUrls = pick(blocks, 7, "instagram_strip")?.urls ?? [];
  const partnerBrands = pick(blocks, 8, "brand_list")?.items ?? [];
  const reviews = pick(blocks, 9, "reviews")?.items ?? [];

  // Each category slide shows a real model from that category — its
  // featured one if there is one — so the photo is a sharp product render
  // and the slide links straight to it.
  const liveCategories = categories.filter(
    (c) => !c.isPlaceholder && CATEGORY_SLIDES[c.slug]
  );
  const slideProducts = await Promise.all(
    liveCategories.map(async (c) => {
      const pool = featured.filter((p) => p.categorySlug === c.slug);
      const candidates = pool.length > 0 ? pool : await getProductsByCategory(c.id, c.slug);
      return candidates.find((p) => p.imageUrl);
    })
  );
  const productChip = (p: Product) => {
    const price = getDisplayPrice(p);
    return {
      name: p.name,
      href: `/catalog/${p.categorySlug}/${p.slug}`,
      note: price
        ? `${p.pricingMode === "per_metre" ? "от " : ""}${formatSum(price.amount)}${
            p.pricingMode === "per_metre" ? " / пог.м" : ""
          }`
        : "Цена по запросу",
    };
  };
  const heroProduct = featured.find((p) => p.imageUrl);

  const slides: HeroSlide[] = [
    {
      image: heroImage?.url || heroProduct?.imageUrl || "/images/hero.jpg",
      alt: heroImage?.alt || "Интерьер с мебелью Molly Home",
      eyebrow: "Мебельная фабрика в Ташкенте",
      title: heroHeading,
      text: heroSubtitle,
      cta: { label: "Смотреть каталог", href: "/catalog" },
      secondary: { label: "Заявка на замер", href: "/request" },
    },
    ...liveCategories.flatMap((c, i) => {
      const product = slideProducts[i];
      const image = product?.imageUrl ?? categoryImage(c);
      if (!image) return [];
      return [
        {
          ...CATEGORY_SLIDES[c.slug],
          image,
          alt: product?.name ?? c.name,
          product: product ? productChip(product) : undefined,
        },
      ];
    }),
  ];

  const cards = Object.fromEntries(
    featured.map((p) => [p.id, <ProductCard key={p.id} product={p} hideFeaturedBadge />])
  );

  return (
    <div className="overflow-x-clip">
      <HeroSlider slides={slides} />

      {/* Categories — bento grid */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Каталог"
            title="Мебель для каждой комнаты"
            text="От кухни по размерам вашей комнаты до спальных гарнитуров и гардеробов."
          />
          <Link href="/catalog" className="btn btn-outline">
            Весь каталог <ArrowIcon />
          </Link>
        </Reveal>
        <div className="mt-10 grid auto-rows-[180px] grid-cols-2 gap-4 sm:auto-rows-[220px] md:grid-cols-4">
          {categories.map((cat, i) => {
            const Icon = getCategoryIcon(cat.slug);
            const image = categoryImage(cat);
            const big = i === 0;
            return (
              <Reveal
                key={cat.id}
                delay={i * 70}
                className={big ? "col-span-2 row-span-2" : ""}
              >
                <Link
                  href={`/catalog/${cat.slug}`}
                  className="group relative flex h-full overflow-hidden rounded-3xl bg-cream-light"
                >
                  {image && !cat.isPlaceholder ? (
                    <Image
                      src={image}
                      alt={cat.name}
                      fill
                      sizes={big ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
                      className="object-cover transition duration-700 ease-out group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon className="h-14 w-14 text-navy/15" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent transition duration-500 group-hover:from-ink/85" />
                  <div className="relative mt-auto flex w-full items-end justify-between gap-3 p-4 sm:p-6">
                    <div>
                      <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <h3
                        className={`font-heading font-bold text-white ${
                          big ? "text-2xl sm:text-3xl" : "text-base sm:text-lg"
                        }`}
                      >
                        {cat.name}
                      </h3>
                      {cat.isPlaceholder && (
                        <span className="mt-1 block text-xs text-white/70">Каталог наполняется</span>
                      )}
                    </div>
                    <span className="flex h-10 w-10 shrink-0 translate-x-2 items-center justify-center rounded-full bg-white text-navy opacity-0 transition duration-500 group-hover:translate-x-0 group-hover:opacity-100 max-sm:hidden">
                      <ArrowIcon />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="bg-cream-light/70 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading
                eyebrow="Популярное"
                title="Модели, которые выбирают"
                text="Выберите раздел, чтобы сузить подборку."
              />
            </Reveal>
            <Reveal delay={100} className="mt-8">
              <FeaturedProducts products={featured} categories={categories} cards={cards} />
            </Reveal>
          </div>
        </section>
      )}

      {/* Why us */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
        <Reveal className="relative">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] sm:aspect-[5/4]">
            {brandImage?.url ? (
              <Image
                src={brandImage.url}
                alt={brandImage.alt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <Image
                src="/images/brand-band.jpg"
                alt="Производство Molly Home"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            )}
          </div>
          <div className="absolute -bottom-6 right-4 flex animate-float items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-xl shadow-navy/10 sm:-right-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sage-light text-sage">
              <UspIcon icon="shield" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-navy">Собственное производство</p>
              <p className="text-xs text-navy/50">Ташкент, Узбекистан</p>
            </div>
          </div>
          <div aria-hidden className="absolute -left-6 -top-6 -z-10 h-40 w-40 rounded-full bg-clay-light blur-2xl" />
        </Reveal>

        <Reveal delay={120}>
          <SectionHeading eyebrow="Почему Molly Home" title={brandHeading} text={brandParagraph} />
          <div className="mt-8 grid grid-cols-2 gap-3">
            {uspStats.map((item, i) => (
              <div
                key={item.label}
                className="group rounded-2xl border border-navy/10 bg-white p-4 transition duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:shadow-navy/10"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl transition duration-300 group-hover:scale-110 ${
                    ["bg-clay-light text-clay", "bg-sage-light text-sage", "bg-cream text-accent-dark", "bg-navy/5 text-navy"][i % 4]
                  }`}
                >
                  <UspIcon icon={item.icon} className="h-5 w-5" />
                </span>
                <p className="mt-3 text-sm font-bold text-navy">{item.value}</p>
                <p className="mt-0.5 text-xs text-navy/55">{item.label}</p>
              </div>
            ))}
          </div>
          <Link href="/about" className="btn btn-primary mt-8">
            Узнать о бренде <ArrowIcon />
          </Link>
        </Reveal>
      </section>

      {/* Process */}
      <section className="relative overflow-hidden bg-ink py-20 text-white">
        <div aria-hidden className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-clay/20 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-sage/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6">
          <Reveal>
            <SectionHeading
              light
              eyebrow="Как мы работаем"
              title="Четыре шага до новой мебели"
              text="Без лишних звонков и поездок — от заявки до сборки у вас дома."
            />
          </Reveal>
          <div className="relative mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <span aria-hidden className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-cream/0 via-cream/30 to-cream/0 lg:block" />
            {PROCESS_STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 120}>
                <div className="group relative flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition duration-500 hover:-translate-y-1 hover:border-cream/30 hover:bg-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cream text-navy transition duration-500 group-hover:rotate-6 group-hover:bg-clay group-hover:text-white">
                      <UspIcon icon={step.icon} className="h-6 w-6" />
                    </span>
                    <span className="font-heading text-5xl font-bold text-white/10 transition group-hover:text-cream/30">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-bold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-white/60">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200} className="mt-12 flex flex-wrap gap-3">
            <Link href="/request" className="btn btn-light">
              Оставить заявку <ArrowIcon />
            </Link>
            <Link href="/delivery" className="btn btn-ghost-light">
              Доставка и оплата
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Configurator teaser */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid overflow-hidden rounded-[2rem] bg-cream md:grid-cols-2">
          <Reveal className="relative min-h-72 md:order-2">
            <Image
              src="/images/categories/garderoby.jpg"
              alt="Шкаф, собранный в конфигураторе"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute left-5 top-5 flex flex-wrap gap-2">
              {["#f4f1ec", "#3b3d40", "#d9c6a5", "#9caf88"].map((c, i) => (
                <span
                  key={c}
                  className="h-8 w-8 animate-float rounded-full border-[3px] border-white shadow-lg"
                  style={{ backgroundColor: c, animationDelay: `${i * 400}ms` }}
                />
              ))}
            </div>
          </Reveal>
          <Reveal delay={120} className="p-8 sm:p-12">
            <span className="eyebrow">Онлайн-конфигуратор</span>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-navy sm:text-4xl">
              Соберите свой шкаф онлайн
            </h2>
            <p className="mt-4 max-w-lg text-sm text-navy/70 sm:text-base">
              Задайте количество модулей, наполнение, отделку фасада и
              фурнитуру — получите готовую спецификацию и оставьте заявку прямо
              на странице конфигуратора.
            </p>
            <ul className="mt-6 flex flex-col gap-3">
              {[
                { icon: "layers", text: "Модули шириной 366 мм — любая конфигурация" },
                { icon: "palette", text: "4 цвета фасада, зеркало и декоративные рейки" },
                { icon: "wrench", text: "Петли Blum или Higold на выбор" },
              ].map((f) => (
                <li key={f.text} className="flex items-center gap-3 text-sm text-navy/80">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-clay shadow-sm">
                    <UspIcon icon={f.icon} className="h-4 w-4" />
                  </span>
                  {f.text}
                </li>
              ))}
            </ul>
            <Link href="/configurator/shkaf" className="btn btn-primary mt-8">
              Собрать шкаф <ArrowIcon />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Gallery slider */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <Reveal>
          <SectionHeading
            eyebrow="Вдохновение"
            title="Мебель Molly Home в интерьере"
            text="Подборка интерьеров — идеи для тех, кто выбирает мебель под свой дом."
          />
        </Reveal>
        <Reveal delay={120} className="mt-8">
          <PhotoSlider items={GALLERY_PHOTOS} />
        </Reveal>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="bg-sage-light/60 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <Reveal>
              <SectionHeading eyebrow="Отзывы" title="Что говорят клиенты" />
            </Reveal>
            <Reveal delay={100} className="mt-8">
              <ReviewsGrid items={reviews} />
            </Reveal>
          </div>
        </section>
      )}

      {/* Instagram */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="Instagram" title="Следите за новинками" />
          <a
            href="https://www.instagram.com/molly_home.uz"
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline"
          >
            @molly_home.uz <ArrowIcon />
          </a>
        </Reveal>
        <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-6">
          {instagramUrls.length > 0
            ? instagramUrls.slice(0, 6).map((url, i) => (
                <Reveal key={url} delay={i * 60}>
                  <a
                    href="https://www.instagram.com/molly_home.uz"
                    target="_blank"
                    rel="noreferrer"
                    className="group relative block aspect-square overflow-hidden rounded-2xl"
                  >
                    <Image
                      src={url}
                      alt="Molly Home в Instagram"
                      fill
                      sizes="(min-width: 768px) 16vw, 33vw"
                      className="object-cover transition duration-700 group-hover:scale-110"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-navy/0 text-white opacity-0 transition duration-300 group-hover:bg-navy/40 group-hover:opacity-100">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
                        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
                        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                      </svg>
                    </span>
                  </a>
                </Reveal>
              ))
            : Array.from({ length: 6 }).map((_, i) => (
                <PlaceholderImage key={i} label="Instagram" aspect="aspect-square" />
              ))}
        </div>
      </section>

      {/* Partner brands */}
      {partnerBrands.length > 0 && (
        <section className="border-t border-navy/10">
          <Reveal className="mx-auto max-w-7xl px-6 py-12">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-navy/40">
              Работаем на фурнитуре мировых брендов
            </p>
            <div className="mt-4">
              <BrandSlider items={partnerBrands} />
            </div>
          </Reveal>
        </section>
      )}

      {/* Closing CTA */}
      <section className="px-4 pb-4 sm:px-6">
        <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-clay px-8 py-14 text-white sm:px-14">
          <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10" />
          <div aria-hidden className="absolute -bottom-28 right-40 h-56 w-56 rounded-full bg-navy/15" />
          <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Замер — бесплатно
              </h2>
              <p className="mt-3 text-white/85">
                Приедем, снимем размеры и подскажем, что лучше подойдёт вашему
                помещению. Точный расчёт стоимости — после замера.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/request" className="btn btn-light">
                Записаться на замер <ArrowIcon />
              </Link>
              <a
                href="https://t.me/mollyhomeuzbot"
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost-light"
              >
                Спросить в Telegram
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
