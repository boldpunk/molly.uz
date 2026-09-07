import { Category, Product } from "./types";

export const categories: Category[] = [
  {
    id: "kitchen",
    name: "Кухонная мебель",
    slug: "kuhonnaya-mebel",
    isPlaceholder: false,
    sortOrder: 1,
    filterKind: "kitchen",
  },
  {
    id: "soft",
    name: "Мягкая мебель",
    slug: "myagkaya-mebel",
    isPlaceholder: true,
    sortOrder: 2,
    filterKind: "none",
  },
  {
    id: "bedroom",
    name: "Спальные гарнитуры",
    slug: "spalnye-garnitury",
    isPlaceholder: false,
    sortOrder: 3,
    filterKind: "collection",
  },
  {
    id: "wardrobe",
    name: "Гардеробы",
    slug: "garderoby",
    isPlaceholder: false,
    sortOrder: 4,
    filterKind: "collection",
  },
  {
    id: "beds",
    name: "Кровати",
    slug: "krovati",
    isPlaceholder: false,
    sortOrder: 5,
    filterKind: "collection",
  },
];

const kitchenHardware = [
  { id: "higold", label: "HIGOLD", pricePerMetre: 3_600_000 },
  { id: "blum", label: "BLUM", pricePerMetre: 3_950_000 },
];

const kitchenColours = [
  { id: "white", label: "Белый матовый", swatch: "#f4f1ec" },
  { id: "graphite", label: "Графит", swatch: "#3b3d40" },
  { id: "sand", label: "Песочный", swatch: "#d9c6a5" },
  { id: "sage", label: "Шалфей", swatch: "#9caf88" },
];

const kitchenModels = [
  { name: "ANTRO", slug: "antro" },
  { name: "SELEN", slug: "selen" },
  { name: "FIONA", slug: "fiona" },
  { name: "TERRA", slug: "terra" },
  { name: "KASELLA", slug: "kasella" },
];

const kitchenProducts: Product[] = kitchenModels.map((model, i) => ({
  id: `kitchen-${model.slug}`,
  categoryId: "kitchen",
  slug: model.slug,
  name: `Кухня ${model.name}`,
  specLine: "Made-to-order · цена за пог.м · ширина без ограничений",
  description:
    "Кухня изготавливается по размерам вашего помещения. Итоговая цена подтверждается после выезда замерщика.",
  pricingMode: "per_metre",
  hardwareOptions: kitchenHardware,
  colourOptions: kitchenColours,
  attributes: [
    { key: "Материал фасада", value: "МДФ, окраска" },
    { key: "Фурнитура", value: "HIGOLD / BLUM" },
    { key: "Ширина", value: "без ограничений — под ваше помещение" },
    { key: "Срок изготовления", value: "уточняется после замера" },
  ],
  isSample: false,
  isFeatured: i < 3,
}));

const savageColour = { id: "walnut", label: "Орех", swatch: "#5b4331" };

const savageProducts: Product[] = [
  {
    id: "wardrobe-savage",
    categoryId: "wardrobe",
    slug: "savage-shkaf",
    name: "Шкаф SAVAGE",
    specLine: "Коллекция SAVAGE · цена по запросу",
    description:
      "Вместительный шкаф из коллекции SAVAGE. Цена уточняется у менеджера — напишите нам в Telegram.",
    pricingMode: "on_request",
    collection: "SAVAGE",
    colourOptions: [savageColour],
    attributes: [
      { key: "Коллекция", value: "SAVAGE" },
      { key: "Материал", value: "ЛДСП, шпон" },
    ],
    isSample: false,
    isFeatured: true,
  },
  {
    id: "bedroom-savage-tumba",
    categoryId: "bedroom",
    slug: "savage-tumba",
    name: "Тумба SAVAGE",
    specLine: "Коллекция SAVAGE · цена по запросу",
    description:
      "Прикроватная тумба из коллекции SAVAGE. Цена уточняется у менеджера.",
    pricingMode: "on_request",
    collection: "SAVAGE",
    colourOptions: [savageColour],
    attributes: [
      { key: "Коллекция", value: "SAVAGE" },
      { key: "Материал", value: "ЛДСП, шпон" },
    ],
    isSample: false,
  },
  {
    id: "bedroom-savage-trumo",
    categoryId: "bedroom",
    slug: "savage-trumo",
    name: "Трюмо SAVAGE",
    specLine: "Коллекция SAVAGE · цена по запросу",
    description:
      "Трюмо с зеркалом из коллекции SAVAGE. Цена уточняется у менеджера.",
    pricingMode: "on_request",
    collection: "SAVAGE",
    colourOptions: [savageColour],
    attributes: [
      { key: "Коллекция", value: "SAVAGE" },
      { key: "Материал", value: "ЛДСП, шпон" },
    ],
    isSample: false,
  },
  {
    id: "beds-savage",
    categoryId: "beds",
    slug: "savage-krovat",
    name: "Кровать SAVAGE",
    specLine: "Коллекция SAVAGE · цена по запросу",
    description:
      "Кровать из коллекции SAVAGE. Цена уточняется у менеджера — напишите нам в Telegram.",
    pricingMode: "on_request",
    collection: "SAVAGE",
    colourOptions: [savageColour],
    attributes: [
      { key: "Коллекция", value: "SAVAGE" },
      { key: "Материал", value: "ЛДСП, массив" },
    ],
    isSample: false,
    isFeatured: true,
  },
];

export const products: Product[] = [...kitchenProducts, ...savageProducts];

export function getCategoryBySlug(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function getProductsByCategory(categoryId: string) {
  return products.filter((p) => p.categoryId === categoryId);
}

export function getProduct(categorySlug: string, productSlug: string) {
  const category = getCategoryBySlug(categorySlug);
  if (!category) return undefined;
  return products.find(
    (p) => p.categoryId === category.id && p.slug === productSlug
  );
}

export function getFeaturedProducts() {
  return products.filter((p) => p.isFeatured);
}

export function getRelatedProducts(product: Product) {
  return products.filter(
    (p) => p.categoryId === product.categoryId && p.id !== product.id
  );
}

export function formatSum(amount: number) {
  return new Intl.NumberFormat("ru-RU").format(amount) + " сум";
}
