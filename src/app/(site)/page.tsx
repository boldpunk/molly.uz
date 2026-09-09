import Link from "next/link";
import { getCategories, getFeaturedProducts, getPageBySlug } from "@/lib/data";
import { ProductCard } from "@/components/product-card";
import { PlaceholderImage } from "@/components/placeholder-image";
import { getCategoryIcon } from "@/components/icons/categories";
import { UspIcon } from "@/components/usp-icons";
import { Reveal } from "@/components/reveal";
import { PhotoSlider } from "@/components/photo-slider";
import { BrandSlider } from "@/components/brand-slider";
import { pageMetadata } from "@/lib/seo";
import { CATEGORY_IMAGES } from "@/lib/category-images";
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

export async function generateMetadata() {
  const home = await getPageBySlug("home");
  const heroImage = home?.blocks?.[2];
  const heroImageUrl =
    heroImage?.type === "image" && heroImage.url ? heroImage.url : "/images/hero.jpg";
  return pageMetadata(
    home,
    "Molly Home — мебель для дома",
    "Molly Home — производитель комфортной мебели для дома. Современные технологии, лояльный бренд.",
    heroImageUrl
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

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-navy/[0.06] blur-3xl"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-6 py-16 md:grid-cols-2 md:py-24">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/25 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-dark">
              Мебельная фабрика в Ташкенте
            </span>
            <h1 className="mt-4 font-heading text-3xl font-bold leading-tight text-navy md:text-5xl">
              {heroHeading}
            </h1>
            <p className="mt-4 max-w-md text-navy/70">{heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/catalog/kuhonnaya-mebel"
                className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-navy/90 hover:shadow-lg hover:shadow-navy/20"
              >
                Смотреть каталог
              </Link>
              <Link
                href="/request"
                className="rounded-full border border-navy/20 px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy/5"
              >
                Оставить заявку на замер
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-navy/10 pt-6">
              <div className="flex items-center gap-2 text-sm text-navy/70">
                <UspIcon icon="ruler" className="h-4 w-4 text-accent-dark" />
                Бесплатный замер
              </div>
              <div className="flex items-center gap-2 text-sm text-navy/70">
                <UspIcon icon="wrench" className="h-4 w-4 text-accent-dark" />
                Под ваши размеры
              </div>
              <div className="flex items-center gap-2 text-sm text-navy/70">
                <UspIcon icon="truck" className="h-4 w-4 text-accent-dark" />
                Доставка и монтаж
              </div>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="relative">
              {heroImage?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroImage.url}
                  alt={heroImage.alt}
                  className="aspect-[4/3] w-full rounded-lg object-cover shadow-xl shadow-navy/10"
                />
              ) : (
                <PlaceholderImage
                  label={heroImage?.alt || "Молли Хоум — интерьер"}
                  aspect="aspect-[4/3]"
                />
              )}
              <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-xl border border-navy/10 bg-white px-4 py-3 shadow-lg sm:flex">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/25 text-accent-dark">
                  <UspIcon icon="shield" className="h-4.5 w-4.5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy">
                    Собственное производство
                  </p>
                  <p className="text-xs text-navy/50">Ташкент</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* USP strip */}
      <section className="border-y border-navy/10 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-8 text-center md:grid-cols-4">
          {uspStats.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy/5 text-navy">
                <UspIcon icon={item.icon} className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-navy">{item.value}</p>
                <p className="mt-1 text-xs text-navy/60">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Category grid */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <Reveal>
          <h2 className="font-heading text-2xl font-bold text-navy">
            Каталог
          </h2>
        </Reveal>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          {categories.map((cat, i) => {
            const Icon = getCategoryIcon(cat.slug);
            return (
              <Reveal key={cat.id} delay={i * 60}>
              <Link
                href={`/catalog/${cat.slug}`}
                className="group flex flex-col gap-3"
              >
                {cat.isPlaceholder ? (
                  <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-navy/20 bg-navy/[0.02] text-center">
                    <Icon className="h-8 w-8 text-navy/25" />
                    <span className="text-xs font-medium text-navy/40">
                      Каталог
                    </span>
                    <span className="text-[11px] text-navy/30">
                      наполняется
                    </span>
                  </div>
                ) : (
                  <div className="relative">
                    {CATEGORY_IMAGES[cat.slug] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={CATEGORY_IMAGES[cat.slug]}
                        alt={cat.name}
                        className="aspect-square w-full rounded-xl object-cover transition group-hover:scale-[1.02]"
                      />
                    ) : (
                      <PlaceholderImage
                        label={cat.name}
                        aspect="aspect-square"
                        className="transition group-hover:scale-[1.02]"
                      />
                    )}
                    <span className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm">
                      <Icon className="h-[18px] w-[18px] text-navy/60" />
                    </span>
                  </div>
                )}
                <span className="text-center text-sm font-medium text-navy">
                  {cat.name}
                </span>
              </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Process steps */}
      <section className="border-y border-navy/10 bg-navy/[0.015]">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <Reveal>
            <h2 className="font-heading text-2xl font-bold text-navy">
              Как мы работаем
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 100}>
                <div className="relative flex flex-col gap-3 rounded-xl border border-navy/10 bg-white p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/25 text-accent-dark">
                    <UspIcon icon={step.icon} className="h-5 w-5" />
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-heading text-sm font-bold text-navy/30">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-heading text-base font-bold text-navy">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-sm text-navy/60">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <Reveal>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-navy">
            Популярные модели
          </h2>
          <Link
            href="/catalog/kuhonnaya-mebel"
            className="text-sm font-medium text-navy hover:underline"
          >
            Смотреть все →
          </Link>
        </div>
        </Reveal>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Configurator teaser */}
      <section className="bg-white">
        <Reveal className="mx-auto flex max-w-7xl flex-col items-center gap-6 rounded-2xl border border-navy/10 px-6 py-14 text-center">
          <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-dark">
            Онлайн-конфигуратор
          </span>
          <h2 className="font-heading text-2xl font-bold text-navy">
            Соберите свою кухню онлайн
          </h2>
          <p className="max-w-lg text-sm text-navy/70">
            Выберите фурнитуру, цвет фасада и укажите ширину — увидите
            примерную стоимость сразу. Точная цена подтверждается после
            выезда замерщика.
          </p>
          <Link
            href="/catalog/kuhonnaya-mebel/antro"
            className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy/90"
          >
            Открыть конфигуратор
          </Link>
        </Reveal>
      </section>

      {/* Gallery slider */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <Reveal>
          <h2 className="font-heading text-2xl font-bold text-navy">
            Мебель Molly Home в интерьере
          </h2>
          <p className="mt-2 max-w-lg text-sm text-navy/60">
            Подборка вдохновляющих интерьеров — идеи для тех, кто выбирает
            мебель под свой дом.
          </p>
        </Reveal>
        <Reveal delay={120} className="mt-6">
          <PhotoSlider items={GALLERY_PHOTOS} />
        </Reveal>
      </section>

      {/* Brand band */}
      <section className="mx-auto grid max-w-7xl items-center gap-8 px-6 py-14 md:grid-cols-2">
        <Reveal>
        {brandImage?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brandImage.url}
            alt={brandImage.alt}
            className="aspect-[4/3] w-full rounded-lg object-cover"
          />
        ) : (
          <PlaceholderImage
            label={brandImage?.alt || "О бренде Molly Home"}
            aspect="aspect-[4/3]"
          />
        )}
        </Reveal>
        <Reveal delay={150}>
        <div>
          <h2 className="font-heading text-2xl font-bold text-navy">
            {brandHeading}
          </h2>
          <p className="mt-4 text-sm text-navy/70">{brandParagraph}</p>
          <Link
            href="/about"
            className="mt-4 inline-block text-sm font-medium text-navy hover:underline"
          >
            Узнать больше →
          </Link>
        </div>
        </Reveal>
      </section>

      {/* Instagram strip */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <Reveal>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold text-navy">
            Мы в Instagram
          </h2>
          <a
            href="https://www.instagram.com/molly_home.uz"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-navy hover:underline"
          >
            @molly_home.uz
          </a>
        </div>
        </Reveal>
        <div className="mt-4 grid grid-cols-3 gap-2 md:grid-cols-6">
          {instagramUrls.length > 0
            ? instagramUrls.map((url) => (
                <a
                  key={url}
                  href="https://www.instagram.com/molly_home.uz"
                  target="_blank"
                  rel="noreferrer"
                  className="block aspect-square overflow-hidden rounded-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="Molly Home в Instagram"
                    className="h-full w-full object-cover transition hover:scale-105"
                  />
                </a>
              ))
            : Array.from({ length: 6 }).map((_, i) => (
                <PlaceholderImage
                  key={i}
                  label="Instagram"
                  aspect="aspect-square"
                />
              ))}
        </div>
      </section>

      {/* Partner brands */}
      {partnerBrands.length > 0 && (
        <section className="border-t border-navy/10 bg-white">
          <Reveal className="mx-auto max-w-7xl px-6 py-10">
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-navy/40">
              Работаем на фурнитуре мировых брендов
            </p>
            <div className="mt-4">
              <BrandSlider items={partnerBrands} />
            </div>
          </Reveal>
        </section>
      )}
    </div>
  );
}
