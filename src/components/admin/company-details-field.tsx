"use client";

import { useState, useTransition } from "react";
import { saveCompanyDetails } from "@/lib/brand-actions";

const inputClass =
  "w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none transition placeholder:text-navy/30 focus:border-navy/30";

export function CompanyDetailsField({
  name,
  tagline,
}: {
  name: string;
  tagline: string;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <form
      action={(formData) => {
        setSaved(false);
        startTransition(async () => {
          await saveCompanyDetails(formData);
          setSaved(true);
        });
      }}
      className="rounded-xl border border-navy/10 bg-white p-5"
    >
      <h3 className="text-sm font-semibold text-navy">Название и слоган</h3>
      <p className="mb-4 mt-1 text-xs text-navy/50">
        Подставляются в шапку и подвал коммерческого предложения и в данные для
        поисковиков.
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-navy/60">
            Название компании
          </label>
          <input
            name="companyName"
            defaultValue={name}
            placeholder="Molly Home"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-navy/60">
            Слоган
          </label>
          <input
            name="companyTagline"
            defaultValue={tagline}
            placeholder="Премиальная корпусная мебель на заказ"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-navy px-5 py-2 text-xs font-semibold text-white transition hover:bg-navy/90 disabled:opacity-50"
        >
          {pending ? "Сохраняем…" : "Сохранить"}
        </button>
        {saved && !pending && (
          <span className="text-xs font-medium text-emerald-600">
            Сохранено
          </span>
        )}
        <span className="text-xs text-navy/40">
          Пустое поле вернёт значение по умолчанию
        </span>
      </div>
    </form>
  );
}
