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
    isPlaceholder: false,
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
  { key: "Высота", value: "260–270 см" },
  { key: "Ширина", value: "без ограничений — под ваше помещение" },
  {
    key: "Материал фасада",
    value: "KASTAMONU, матовый МДФ + ПВХ-плёнка (6 вариантов)",
  },
  { key: "Цвет корпуса", value: "3 варианта" },
  { key: "Клеевой состав", value: "PUR — влагостойкий, повышенная прочность" },
  { key: "Кромка", value: "ПВХ-кромка со всех сторон деталей корпуса" },
  { key: "Фурнитура", value: "HIGOLD / BLUM" },
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
  basePrice?: number;
  discountPercent?: number;
  hardwareOptions?: HardwareOption[];
  colourOptions?: ColourOption[];
  collection?: string;
  attributes: ProductAttribute[];
  isSample?: boolean;
  isFeatured?: boolean;
  imageUrl?: string;
  galleryUrls?: string[];
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

const softFurnitureProducts: SeedProduct[] = [
  {
    categoryKey: "soft",
    slug: "queen",
    name: "Диван Queen",
    specLine: "Угловой модульный диван · готовое решение",
    description:
      "Угловой модульный диван Queen — просторная посадочная зона с мягкими подушками и плавной геометрией. Обивка — приятная на ощупь ткань букле. Доступен в трёх цветах.",
    pricingMode: "fixed",
    basePrice: 10_800_000,
    attributes: [
      { key: "Тип", value: "Угловой модульный диван" },
      { key: "Обивка", value: "Ткань букле" },
      { key: "Цвета", value: "Бежевый, Синий, Серый" },
    ],
    isSample: false,
    isFeatured: true,
    imageUrl: "/images/products/queen/beige-1.png",
    galleryUrls: [
      "/images/products/queen/beige-2.png",
      "/images/products/queen/beige-3.png",
      "/images/products/queen/beige-4.png",
    ],
    colourOptions: [
      {
        id: "beige",
        label: "Бежевый",
        swatch: "#a4886a",
        imageUrl: "/images/products/queen/beige-1.png",
        galleryUrls: [
          "/images/products/queen/beige-2.png",
          "/images/products/queen/beige-3.png",
          "/images/products/queen/beige-4.png",
        ],
      },
      {
        id: "blue",
        label: "Синий",
        swatch: "#48566b",
        imageUrl: "/images/products/queen/blue-1.png",
        galleryUrls: [
          "/images/products/queen/blue-2.png",
          "/images/products/queen/blue-3.png",
          "/images/products/queen/blue-4.png",
        ],
      },
      {
        id: "grey",
        label: "Серый",
        swatch: "#767676",
        imageUrl: "/images/products/queen/grey-1.png",
        galleryUrls: [
          "/images/products/queen/grey-2.png",
          "/images/products/queen/grey-3.png",
          "/images/products/queen/grey-4.png",
        ],
      },
    ],
  },
  {
    categoryKey: "soft",
    slug: "piola",
    name: "Диван Piola",
    specLine: "Мягкий диван с округлым каркасом · готовое решение",
    description:
      "Диван Piola — мягкий диван с округлым каркасом и контрастными подушками. К коллекции также относятся кресла Piola в тех же цветах — уточняйте у менеджера.",
    pricingMode: "fixed",
    basePrice: 12_800_000,
    attributes: [
      { key: "Тип", value: "Диван с мягким округлым каркасом" },
      { key: "Обивка", value: "Ткань букле, контрастные подушки" },
      { key: "Цвета", value: "Терракотовый, Бежевый" },
    ],
    isSample: false,
    isFeatured: true,
    imageUrl: "/images/products/piola/terracotta-2.png",
    galleryUrls: [
      "/images/products/piola/terracotta-1.png",
      "/images/products/piola/terracotta-3.png",
      "/images/products/piola/terracotta-4.png",
    ],
    colourOptions: [
      {
        id: "terracotta",
        label: "Терракотовый",
        swatch: "#b3532c",
        imageUrl: "/images/products/piola/terracotta-2.png",
        galleryUrls: [
          "/images/products/piola/terracotta-1.png",
          "/images/products/piola/terracotta-3.png",
          "/images/products/piola/terracotta-4.png",
        ],
      },
      {
        id: "beige",
        label: "Бежевый",
        swatch: "#c9bba0",
        imageUrl: "/images/products/piola/beige-1.png",
        galleryUrls: ["/images/products/piola/beige-2.png"],
      },
    ],
  },
];

export const products: SeedProduct[] = [
  ...kitchenProducts,
  ...savageProducts,
  ...softFurnitureProducts,
];
