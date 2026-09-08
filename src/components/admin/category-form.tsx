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
    <form
      action={action}
      className="max-w-2xl rounded-xl border border-navy/10 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-navy">Название</span>
          <input
            required
            name="name"
            defaultValue={category?.name}
            className="input"
            placeholder="Кухонная мебель"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-navy">Slug (для URL)</span>
          <input
            required
            name="slug"
            defaultValue={category?.slug}
            pattern="[a-z0-9-]+"
            title="Только строчные латинские буквы, цифры и дефис"
            className="input font-mono"
            placeholder="kuhonnaya-mebel"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-navy">
            Тип фильтров в каталоге
          </span>
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

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-navy">Порядок сортировки</span>
          <input
            type="number"
            name="sortOrder"
            defaultValue={category?.sortOrder ?? 0}
            className="input"
          />
        </label>
      </div>

      <label className="mt-5 flex items-start gap-3 rounded-lg border border-navy/10 bg-navy/[0.02] p-3.5 text-sm text-navy">
        <input
          type="checkbox"
          name="isPlaceholder"
          defaultChecked={category?.isPlaceholder}
          className="mt-0.5 h-4 w-4 accent-accent-dark"
        />
        <span>
          <span className="font-medium">Каталог пока наполняется</span>
          <span className="mt-0.5 block text-xs text-navy/50">
            Показывать честную заглушку в каталоге вместо товаров, пока
            модели ещё не добавлены.
          </span>
        </span>
      </label>

      <div className="mt-6 flex items-center gap-3 border-t border-navy/10 pt-5">
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
