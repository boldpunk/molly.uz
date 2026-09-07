"use client";

import Link from "next/link";
import { useState } from "react";
import { formatSum } from "@/lib/format";
import { useRequestList } from "@/lib/request-list-context";
import { submitRequest } from "@/lib/actions";

export default function RequestPage() {
  const { items, removeItem, clear } = useRequestList();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "submitted" | "error">(
    "idle"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    try {
      await submitRequest(name, phone, notes, items);
      setStatus("submitted");
      clear();
    } catch {
      setStatus("error");
    }
  }

  if (status === "submitted") {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="font-heading text-2xl font-bold text-navy">
          Заявка отправлена
        </h1>
        <p className="mt-3 text-sm text-navy/70">
          Спасибо, {name || "мы получили вашу заявку"}! Наш менеджер свяжется
          с вами по телефону {phone} для уточнения деталей и записи на замер.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy/90"
        >
          На главную
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-heading text-2xl font-bold text-navy">
        Заявка на замер
      </h1>
      <p className="mt-2 text-sm text-navy/60">
        Добавьте один или несколько товаров с сайта, укажите контакты — и мы
        свяжемся с вами, чтобы согласовать замер и итоговую цену.
      </p>

      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-navy/20 bg-navy/[0.02] px-6 py-14 text-center">
          <p className="text-sm text-navy/60">Список заявки пуст.</p>
          <Link
            href="/catalog/kuhonnaya-mebel"
            className="mt-6 inline-block rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy/90"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-8">
          <ul className="flex flex-col gap-3">
            {items.map((item, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-4 rounded-xl border border-navy/10 bg-white p-4"
              >
                <div>
                  <Link
                    href={`/catalog/${item.categorySlug}/${item.productSlug}`}
                    className="font-medium text-navy hover:underline"
                  >
                    {item.productName}
                  </Link>
                  <p className="mt-1 text-xs text-navy/60">
                    {[
                      item.hardwareLabel,
                      item.colourLabel,
                      item.widthMetres ? `${item.widthMetres.toFixed(1)} м` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {item.estimate && (
                    <p className="mt-1 text-sm font-semibold text-navy">
                      ≈ {formatSum(item.estimate)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  className="text-xs font-medium text-navy/50 hover:text-navy"
                >
                  Удалить
                </button>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-4 rounded-xl border border-navy/10 bg-white p-5">
            <div>
              <label className="text-sm font-medium text-navy">Имя</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy/15 px-3 py-2 text-sm"
                placeholder="Как к вам обращаться"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-navy">Телефон</label>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-md border border-navy/15 px-3 py-2 text-sm"
                placeholder="+998 __ ___ __ __"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-navy">
                Комментарий (необязательно)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-navy/15 px-3 py-2 text-sm"
                placeholder="Удобное время для звонка, адрес и т.д."
              />
            </div>
          </div>

          {status === "error" && (
            <p className="text-sm font-medium text-red-600">
              Не удалось отправить заявку. Попробуйте ещё раз.
            </p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-60"
          >
            {status === "submitting" ? "Отправляем…" : "Отправить заявку"}
          </button>
        </form>
      )}
    </div>
  );
}
