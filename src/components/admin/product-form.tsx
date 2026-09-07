"use client";

import { useState } from "react";
import { DynamicListField, Row } from "./dynamic-list-field";
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
      <div className="grid grid-cols-2 gap-4">
        <Field label="Название">
          <input
            required
            name="name"
            defaultValue={product?.name}
            className="input"
          />
        </Field>
        <Field label="Slug (для URL)">
          <input
            required
            name="slug"
            defaultValue={product?.slug}
            pattern="[a-z0-9-]+"
            title="Только строчные латинские буквы, цифры и дефис"
            className="input"
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

      <div className="grid grid-cols-2 gap-4">
        <Field label="Ценообразование">
          <select
            name="pricingMode"
            value={pricingMode}
            onChange={(e) => setPricingMode(e.target.value as PricingMode)}
            className="input"
          >
            <option value="per_metre">За погонный метр (конфигуратор)</option>
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

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-navy">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={product?.isFeatured}
          />
          Показывать в «Популярных моделях»
        </label>
        <label className="flex items-center gap-2 text-sm text-navy">
          <input
            type="checkbox"
            name="isSample"
            defaultChecked={product?.isSample}
          />
          Образец / плейсхолдер
        </label>
      </div>

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

      <button
        type="submit"
        className="w-fit rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy/90"
      >
        Сохранить
      </button>
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
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-navy">{label}</span>
      {children}
    </label>
  );
}
