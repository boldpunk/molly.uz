"use client";

import { useState } from "react";
import { DynamicListField, Row } from "./dynamic-list-field";
import { FormSection } from "./form-section";
import { ImageUploadField } from "./image-upload-field";
import { GalleryUploadField } from "./gallery-upload-field";
import { Category, Product, PricingMode } from "@/lib/types";

export function ProductForm({
  action,
  categories,
  product,
}: {
  action: (formData: FormData) => void;
  categories: Category[];
  product?: Product;
}) {
  const [pricingMode, setPricingMode] = useState<PricingMode>(
    product?.pricingMode ?? "on_request"
  );

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-6">
      <FormSection title="Основное">
        <Field label="Фото товара">
          <ImageUploadField name="imageUrl" initialUrl={product?.imageUrl} />
        </Field>

        <Field label="Дополнительные фото (галерея)">
          <GalleryUploadField
            name="galleryUrlsJson"
            initialUrls={product?.galleryUrls ?? []}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Название">
            <input
              required
              name="name"
              defaultValue={product?.name}
              className="input"
              placeholder="Кухня ANTRO"
            />
          </Field>
          <Field label="Slug (для URL)">
            <input
              required
              name="slug"
              defaultValue={product?.slug}
              pattern="[a-z0-9-]+"
              title="Только строчные латинские буквы, цифры и дефис"
              className="input font-mono"
              placeholder="antro"
            />
          </Field>
        </div>

        <Field label="Категория">
          <select
            required
            name="categoryId"
            defaultValue={product?.categoryId}
            className="input"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Короткое описание (spec line)">
          <input
            name="specLine"
            defaultValue={product?.specLine}
            className="input"
            placeholder="Made-to-order · цена за пог.м"
          />
        </Field>

        <Field label="Полное описание">
          <textarea
            name="description"
            defaultValue={product?.description}
            rows={3}
            className="input"
          />
        </Field>
      </FormSection>

      <FormSection
        title="Цена и видимость"
        description="Как товар продаётся и где показывается в каталоге"
      >
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ценообразование">
            <select
              name="pricingMode"
              value={pricingMode}
              onChange={(e) => setPricingMode(e.target.value as PricingMode)}
              className="input"
            >
              <option value="per_metre">
                За погонный метр (конфигуратор)
              </option>
              <option value="on_request">Цена по запросу</option>
              <option value="fixed">Фиксированная цена</option>
            </select>
          </Field>
          <Field label="Коллекция (необязательно)">
            <input
              name="collection"
              defaultValue={product?.collection}
              placeholder="SAVAGE"
              className="input"
            />
          </Field>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="flex items-center gap-2 text-sm text-navy">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={product?.isFeatured}
              className="h-4 w-4 accent-sage-dark"
            />
            Показывать в «Популярных моделях»
          </label>
          <label className="flex items-center gap-2 text-sm text-navy">
            <input
              type="checkbox"
              name="isSample"
              defaultChecked={product?.isSample}
              className="h-4 w-4 accent-sage-dark"
            />
            Образец / плейсхолдер
          </label>
        </div>
      </FormSection>

      <FormSection
        title="Опции и характеристики"
        description="Фурнитура и цвета отображаются как выбор в конфигураторе на сайте"
      >
        {pricingMode === "per_metre" && (
          <DynamicListField
            name="hardwareOptionsJson"
            label="Фурнитура (цена за пог.м)"
            fields={[
              { key: "id", label: "ID", placeholder: "higold" },
              { key: "label", label: "Название", placeholder: "HIGOLD" },
              {
                key: "pricePerMetre",
                label: "Цена/пог.м",
                type: "number",
                placeholder: "3600000",
              },
            ]}
            initialItems={(product?.hardwareOptions ?? []) as unknown as Row[]}
          />
        )}

        <DynamicListField
          name="colourOptionsJson"
          label="Цвета / отделка"
          fields={[
            { key: "id", label: "ID", placeholder: "white" },
            { key: "label", label: "Название", placeholder: "Белый матовый" },
            { key: "swatch", label: "Цвет (hex)", placeholder: "#f4f1ec" },
          ]}
          initialItems={(product?.colourOptions ?? []) as unknown as Row[]}
        />

        <DynamicListField
          name="attributesJson"
          label="Характеристики"
          fields={[
            { key: "key", label: "Параметр", placeholder: "Материал" },
            { key: "value", label: "Значение", placeholder: "МДФ, окраска" },
          ]}
          initialItems={(product?.attributes ?? []) as unknown as Row[]}
        />
      </FormSection>

      <FormSection
        title="SEO"
        description="Заголовок и описание для поисковиков — необязательно, по умолчанию используются название и краткое описание товара"
      >
        <Field label="Meta-заголовок">
          <input
            name="metaTitle"
            defaultValue={product?.metaTitle}
            className="input"
            placeholder={product?.name ? `${product.name} — Molly Home` : ""}
          />
        </Field>
        <Field label="Meta-описание">
          <textarea
            name="metaDescription"
            defaultValue={product?.metaDescription}
            rows={2}
            className="input"
            placeholder={product?.specLine || ""}
          />
        </Field>
      </FormSection>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-navy/90 hover:shadow"
        >
          Сохранить
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-navy">{label}</span>
      {children}
    </label>
  );
}
