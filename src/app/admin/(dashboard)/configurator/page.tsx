import { getWardrobeFinishes } from "@/lib/data";
import { updateWardrobeFinishes } from "@/lib/admin-actions";
import { PageHeader } from "@/components/admin/page-header";
import { FormSection } from "@/components/admin/form-section";
import { WardrobeFinishesEditor } from "@/components/admin/wardrobe-finishes-editor";

export const dynamic = "force-dynamic";

export default async function AdminConfiguratorPage() {
  const finishes = await getWardrobeFinishes();

  return (
    <div>
      <PageHeader
        title="Конфигуратор шкафа"
        description="/configurator/shkaf"
      />

      <form
        action={updateWardrobeFinishes}
        className="mt-6 flex max-w-2xl flex-col gap-6"
      >
        <FormSection
          title="Отделка фасада"
          description="Цвета, которые видит покупатель в конфигураторе. RAL необязателен, показывается рядом с названием. Цвет задаётся HEX-кодом и применяется сразу на сайте."
        >
          <WardrobeFinishesEditor name="finishesJson" initialFinishes={finishes} />
        </FormSection>

        <div>
          <button
            type="submit"
            className="rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-navy/90 hover:shadow"
          >
            Сохранить
          </button>
        </div>
      </form>
    </div>
  );
}
