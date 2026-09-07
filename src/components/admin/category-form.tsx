"use client";

import { Category } from "@/lib/types";

export function CategoryForm({
  action,
  category,
}: {
  action: (formData: FormData) => void;
  category?: Category;
}) {
  return (
    <form action={action} className="flex max-w-lg flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-navy">Название</span>
        <input
          required
          name="name"
          defaultValue={category?.name}
          className="input"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-navy">Slug (для URL)</span>
        <input
          required
          name="slug"
          defaultValue={category?.slug}
          pattern="[a-z0-9-]+"
          title="Только строчные латинские буквы, цифры и дефис"
          className="input"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-navy">Тип фильтров в каталоге</span>
        <select
          name="filterKind"
          defaultValue={category?.filterKind ?? "none"}
          className="input"
        >
          <option value="kitchen">Кухни (фурнитура + цвет)</option>
          <option value="collection">Коллекция (цвет)</option>
          <option value="none">Без фильтров</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-navy">Порядок сортировки</span>
        <input
          type="number"
          name="sortOrder"
          defaultValue={category?.sortOrder ?? 0}
          className="input w-32"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-navy">
        <input
          type="checkbox"
          name="isPlaceholder"
          defaultChecked={category?.isPlaceholder}
        />
        Каталог пока наполняется (показывать честную заглушку вместо
        товаров)
      </label>

      <button
        type="submit"
        className="w-fit rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy/90"
      >
        Сохранить
      </button>
    </form>
  );
}
