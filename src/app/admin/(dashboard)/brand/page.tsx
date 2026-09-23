import {
  getBrandAssets,
  BRAND_SLOTS,
  BRAND_SLOT_LABELS,
  BRAND_SLOT_HINTS,
  BRAND_FALLBACKS,
  type BrandSlot,
} from "@/lib/brand";
import { PageHeader } from "@/components/admin/page-header";
import { FormSection } from "@/components/admin/form-section";
import { BrandAssetField } from "@/components/admin/brand-asset-field";
import { LogoScaleField } from "@/components/admin/logo-scale-field";

export const dynamic = "force-dynamic";

const SLOT_TO_ASSET = {
  logo_primary: "primary",
  logo_reversed: "reversed",
  logo_square: "square",
} as const;

export default async function AdminBrandPage() {
  const assets = await getBrandAssets();

  return (
    <div>
      <PageHeader
        title="Бренд"
        description="Логотипы сайта, панели и коммерческих предложений. Если файл не загружен, используется логотип из брендбука."
      />

      <div className="mt-6 flex flex-col gap-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {BRAND_SLOTS.map((slot: BrandSlot) => (
            <BrandAssetField
              key={slot}
              slot={slot}
              label={BRAND_SLOT_LABELS[slot]}
              hint={BRAND_SLOT_HINTS[slot]}
              currentUrl={assets[SLOT_TO_ASSET[slot]]}
              fallbackUrl={BRAND_FALLBACKS[slot]}
              dark={slot === "logo_reversed"}
            />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <LogoScaleField
            initialScale={assets.scale}
            previewUrl={assets.primary ?? BRAND_FALLBACKS.logo_primary}
          />
        </div>

        <FormSection
          title="Правила из брендбука"
          description="Их стоит держать в голове, меняя логотип"
        >
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-navy/70">
            <li>
              Логотип — цельный знак. Не набирайте название другим шрифтом, не
              переставляйте части.
            </li>
            <li>
              Только два цвета: тёмно-синий <code>#182B4C</code> и кремовый{" "}
              <code>#F9E8D8</code>. Никаких градиентов, теней и обводок.
            </li>
            <li>
              Не растягивайте, не сжимайте и не наклоняйте. Пропорции всегда
              сохраняются.
            </li>
            <li>
              Свободное поле вокруг логотипа — не меньше высоты буквы «o».
              Минимальная ширина на экране 160&nbsp;px.
            </li>
            <li>
              Квадратная версия — для аватарок и соцсетей. Favicon сайта собран
              из одной буквы «m» без фона: на светлой вкладке она тёмно-синяя,
              на тёмной — кремовая.
            </li>
          </ul>
        </FormSection>
      </div>
    </div>
  );
}
