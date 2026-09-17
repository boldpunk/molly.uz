import type { Metadata } from "next";
import { getCategoryBySlug, getProductsByCategory } from "@/lib/data";
import { WardrobeConfigurator } from "@/components/wardrobe-configurator";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Конфигуратор шкафов — Molly Home",
  description:
    "Соберите шкаф под ваше помещение: количество модулей, наполнение, отделка фасада и фурнитура — оставьте заявку, и мы посчитаем точную стоимость.",
};

export default async function WardrobeConfiguratorPage() {
  const category = await getCategoryBySlug("garderoby");
  const products = category
    ? await getProductsByCategory(category.id, category.slug)
    : [];
  // Links the configured lead to a real catalog entry (so "Оставить
  // заявку" produces a request item the admin panel can open) without
  // requiring one to exist — falls back to no link if the category is
  // still empty.
  const linkedProduct = products[0];

  return (
    <WardrobeConfigurator
      productId={linkedProduct?.id}
      productSlug={linkedProduct?.slug ?? "shkaf"}
      categorySlug="garderoby"
    />
  );
}
