import { HardwareOption, ColourOption, ProductAttribute } from "./schema";

export const categories = [
  {
    key: "kitchen",
    name: "Кухонная мебель",
    slug: "kuhonnaya-mebel",
    isPlaceholder: false,
    sortOrder: 1,
    filterKind: "kitchen" as const,
  },
  {
    key: "soft",
    name: "Мягкая мебель",
    slug: "myagkaya-mebel",
    isPlaceholder: true,
    sortOrder: 2,
    filterKind: "none" as const,
  },
  {
    key: "bedroom",
    name: "Спальные гарнитуры",
    slug: "spalnye-garnitury",
    isPlaceholder: false,
    sortOrder: 3,
    filterKind: "collection" as const,
  },
  {
    key: "wardrobe",
    name: "Гардеробы",
    slug: "garderoby",
    isPlaceholder: false,
    sortOrder: 4,
    filterKind: "collection" as const,
  },
  {
    key: "beds",
    name: "Кровати",
    slug: "krovati",
    isPlaceholder: false,
    sortOrder: 5,
    filterKind: "collection" as const,
  },
];

const kitchenHardware: HardwareOption[] = [
  { id: "higold", label: "HIGOLD", pricePerMetre: 3_600_000 },
  { id: "blum", label: "BLUM", pricePerMetre: 3_950_000 },
];

const kitchenColours: ColourOption[] = [
  { id: "white", label: "Белый матовый", swatch: "#f4f1ec" },
  { id: "graphite", label: "Графит", swatch: "#3b3d40" },
  { id: "sand", label: "Песочный", swatch: "#d9c6a5" },
  { id: "sage", label: "Шалфей", swatch: "#9caf88" },
];

const kitchenAttributes: ProductAttribute[] = [
  { key: "Материал фасада", value: "МДФ, окраска" },
  { key: "Фурнитура", value: "HIGOLD / BLUM" },
  { key: "Ширина", value: "без ограничений — под ваше помещение" },
  { key: "Срок изготовления", value: "уточняется после замера" },
];

const kitchenModels = [
  { name: "ANTRO", slug: "antro" },
  { name: "SELEN", slug: "selen" },
  { name: "FIONA", slug: "fiona" },
  { name: "TERRA", slug: "terra" },
  { name: "KASELLA", slug: "kasella" },
];

interface SeedProduct {
  categoryKey: string;
  slug: string;
  name: string;
  specLine: string;
  description: string;
  pricingMode: "per_metre" | "fixed" | "on_request";
  hardwareOptions?: HardwareOption[];
  colourOptions?: ColourOption[];
  collection?: string;
  attributes: ProductAttribute[];
  isSample?: boolean;
  isFeatured?: boolean;
}

const kitchenProducts: SeedProduct[] = kitchenModels.map((model, i) => ({
  categoryKey: "kitchen",
  slug: model.slug,
  name: `Кухня ${model.name}`,
  specLine: "Made-to-order · цена за пог.м · ширина без ограничений",
  description:
    "Кухня изготавливается по размерам вашего помещения. Итоговая цена подтверждается после выезда замерщика.",
  pricingMode: "per_metre",
  hardwareOptions: kitchenHardware,
  colourOptions: kitchenColours,
  attributes: kitchenAttributes,
  isSample: false,
  isFeatured: i < 3,
}));

const savageColour: ColourOption = { id: "walnut", label: "Орех", swatch: "#5b4331" };

const savageProducts: SeedProduct[] = [
  {
    categoryKey: "wardrobe",
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
    categoryKey: "bedroom",
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
    categoryKey: "bedroom",
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
    categoryKey: "beds",
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

export const products: SeedProduct[] = [...kitchenProducts, ...savageProducts];
