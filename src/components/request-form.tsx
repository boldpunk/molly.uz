"use client";

import Link from "next/link";
import { useState } from "react";
import { formatSum } from "@/lib/format";
import { useRequestList } from "@/lib/request-list-context";
import { submitRequest } from "@/lib/actions";
import { reachGoal } from "@/components/yandex-metrika";
import { PhoneInput } from "@/components/phone-input";
import { buildStatusDeepLink } from "@/lib/telegram-links";
import { PageHero } from "@/components/page-hero";

export function RequestForm({
  initialName = "",
  initialPhone = "",
  customerId,
}: {
  initialName?: string;
  initialPhone?: string;
  customerId?: string;
}) {
  const { items, removeItem, clear } = useRequestList();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [notes, setNotes] = useState("");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [trap, setTrap] = useState("");
  const [error, setError] = useState(
    "Не удалось отправить заявку. Попробуйте ещё раз."
  );
  const [status, setStatus] = useState<"idle" | "submitting" | "submitted" | "error">(
    "idle"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    try {
      const result = await submitRequest(
        name,
        phone,
        notes,
        items,
        customerId,
        trap
      );
      if (!result.ok) {
        setError(result.error);
        setStatus("error");
        return;
      }
      setOrderNumber(result.orderNumber);
      setStatus("submitted");
      reachGoal("request_submit", { source: "request_form" });
      clear();
    } catch {
      setError("Не удалось отправить заявку. Попробуйте ещё раз.");
      setStatus("error");
    }
  }

  if (status === "submitted") {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <span className="mx-auto flex h-20 w-20 animate-fade-up items-center justify-center rounded-full bg-sage-light text-sage">
          <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight text-navy">
          Заявка отправлена
        </h1>
        {orderNumber && (
          <p className="mt-2 text-sm font-medium text-navy/50">
            Номер заявки: <span className="text-navy">{orderNumber}</span>
          </p>
        )}
        <p className="mt-3 text-sm text-navy/70">
          Спасибо, {name || "мы получили вашу заявку"}! Наш менеджер свяжется
          с вами по телефону {phone} для уточнения деталей и записи на замер.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href={buildStatusDeepLink(phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn bg-[#2AABEE] text-white hover:shadow-lg hover:shadow-[#2AABEE]/30"
          >
            Статус заявки в Telegram
          </a>
          <Link
            href="/"
            className="btn btn-outline"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
    <PageHero
      eyebrow="Бесплатно"
      title="Заявка на замер"
      text="Добавьте один или несколько товаров с сайта и укажите контакты — менеджер перезвонит, согласует замер и рассчитает точную цену."
    />
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.5fr_1fr]">
    <div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-navy/20 bg-cream-light/60 px-6 py-14 text-center">
          <p className="font-heading text-lg font-bold text-navy">Список заявки пуст</p>
          <p className="mt-2 text-sm text-navy/60">
            Выберите модель в каталоге и нажмите «Оставить заявку» — она появится здесь.
          </p>
          <Link href="/catalog" className="btn btn-primary mt-6">
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <ul className="flex flex-col gap-3">
            {items.map((item, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-4 rounded-2xl border border-navy/10 bg-white p-5 transition hover:shadow-lg hover:shadow-navy/5"
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

          <div className="flex flex-col gap-5 rounded-3xl border border-navy/10 bg-white p-6 shadow-xl shadow-navy/[0.04]">
            <h2 className="font-heading text-lg font-bold text-navy">Ваши контакты</h2>
            <div>
              <label className="text-sm font-medium text-navy">Имя</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input mt-1.5 rounded-xl py-3"
                placeholder="Как к вам обращаться"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-navy">Телефон</label>
              <PhoneInput
                required
                value={phone}
                onChange={setPhone}
                className="mt-1"
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
                className="input mt-1.5 rounded-xl py-3"
                placeholder="Удобное время для звонка, адрес и т.д."
              />
            </div>
          </div>

          {/* Bots fill every field they find; people never see this one. */}
          <input
            type="text"
            name="company"
            value={trap}
            onChange={(e) => setTrap(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute left-[-9999px] h-px w-px opacity-0"
          />

          {status === "error" && (
            <p className="text-sm font-medium text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="btn btn-primary py-4 text-base disabled:opacity-60"
          >
            {status === "submitting" ? "Отправляем…" : "Отправить заявку"}
          </button>
          <p className="-mt-4 text-xs text-navy/40">
            Отправляя заявку, вы соглашаетесь с{" "}
            <Link href="/privacy" className="underline hover:text-navy">
              политикой конфиденциальности
            </Link>
            .
          </p>
        </form>
      )}
    </div>

    <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
      <div className="rounded-3xl bg-navy p-7 text-white">
        <h2 className="font-heading text-lg font-bold">Что будет дальше</h2>
        <ol className="mt-5 flex flex-col gap-5">
          {[
            ["Звонок менеджера", "Уточним детали и удобное время замера."],
            ["Бесплатный замер", "Приедем и снимем точные размеры помещения."],
            ["Точная цена", "Рассчитаем стоимость под ваш проект и отделку."],
          ].map(([title, text], i) => (
            <li key={title} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cream text-sm font-bold text-navy">
                {i + 1}
              </span>
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="mt-0.5 block text-sm text-white/60">{text}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <a
        href="https://t.me/mollyhomeuzbot"
        target="_blank"
        rel="noreferrer"
        className="group flex items-center justify-between gap-4 rounded-3xl border border-navy/10 bg-white p-6 transition hover:shadow-xl hover:shadow-navy/10"
      >
        <span>
          <span className="block text-sm font-semibold text-navy">Есть вопрос?</span>
          <span className="mt-0.5 block text-sm text-navy/60">Напишите менеджеру в Telegram</span>
        </span>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2aabee] text-white transition group-hover:scale-110">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path d="M21.5 4.3 2.9 11.5c-1.3.5-1.3 1.2-.2 1.6l4.8 1.5 1.8 5.6c.2.6.1.9.8.9.5 0 .7-.2 1-.5l2.3-2.3 4.9 3.6c.9.5 1.5.2 1.8-.8l3.2-15.2c.3-1.3-.5-1.9-1.8-1.4Z" fill="currentColor" />
          </svg>
        </span>
      </a>
    </aside>
    </div>
    </>
  );
}
