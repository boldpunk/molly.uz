import { PlaceholderImage } from "@/components/placeholder-image";

export const metadata = { title: "О бренде — Molly Home" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="font-heading text-3xl font-bold text-navy">О бренде</h1>
      <PlaceholderImage
        label="О бренде Molly Home"
        aspect="aspect-[16/9]"
        className="mt-6"
      />
      <p className="mt-6 text-sm leading-relaxed text-navy/70">
        Molly Home — производитель комфортной мебели для дома. Современные
        технологии, лояльный бренд.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-navy/70">
        Мы производим кухни на заказ по размерам вашего помещения, а также
        готовые модели гардеробов, спальных гарнитуров и кроватей. Это
        содержимое страницы будет редактироваться через визуальный
        конструктор страниц без участия разработчика.
      </p>
    </div>
  );
}
