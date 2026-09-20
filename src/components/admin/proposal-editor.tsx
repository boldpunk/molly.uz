"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { ProposalBrand } from "@/db/schema";
import type {
  Proposal,
  ProposalCustomerOption,
  ProposalStatus,
  TextTemplate,
} from "@/lib/proposal-types";
import {
  PROPOSAL_STATUSES,
  PROPOSAL_STATUS_LABELS,
} from "@/lib/proposal-types";
import {
  formatMoney,
  lineTotalMinor,
  milliToInput,
  minorToInput,
  parseMoneyToMinor,
  parseQuantityToMilli,
  PROPOSAL_CURRENCIES,
  PROPOSAL_UNITS,
  type ProposalCurrency,
  type ProposalUnit,
} from "@/lib/proposal-money";
import {
  PROPOSAL_LANGUAGES,
  PROPOSAL_LANGUAGE_LABELS,
  UNIT_ADMIN_LABELS,
  type ProposalLanguage,
} from "@/lib/proposal-i18n";
import { PROPOSAL_THEMES, normalizeHex } from "@/lib/proposal-theme";
import { saveProposal } from "@/lib/proposal-actions";
import { FormSection } from "./form-section";
import { ImageDropField } from "./image-drop-field";
import { TrashIcon } from "./icons";

interface DraftItem {
  key: string;
  name: string;
  description: string;
  imageUrl: string | null;
  quantity: string;
  unit: ProposalUnit;
  dimensions: string;
  unitPrice: string;
}

const inputClass =
  "w-full rounded-lg border border-navy/10 bg-white px-3 py-2 text-sm text-navy outline-none transition placeholder:text-navy/30 focus:border-navy/30";
const labelClass = "mb-1.5 block text-xs font-medium text-navy/60";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function newItem(): DraftItem {
  return {
    key: Math.random().toString(36).slice(2),
    name: "",
    description: "",
    imageUrl: null,
    quantity: "1",
    unit: "pcs",
    dimensions: "",
    unitPrice: "",
  };
}

export function ProposalEditor({
  proposal,
  customers,
  brandDirectory,
  templates,
}: {
  proposal: Proposal;
  customers: ProposalCustomerOption[];
  brandDirectory: ProposalBrand[];
  templates: TextTemplate[];
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const [language, setLanguage] = useState<ProposalLanguage>(proposal.language);
  const [currency, setCurrency] = useState<ProposalCurrency>(proposal.currency);
  const [themeColor, setThemeColor] = useState(proposal.themeColor);
  const [customerId, setCustomerId] = useState(proposal.customerId ?? "");
  const [clientName, setClientName] = useState(proposal.clientName);
  const [clientPhone, setClientPhone] = useState(proposal.clientPhone);
  const [finalText, setFinalText] = useState(proposal.finalText);
  const [brands, setBrands] = useState<ProposalBrand[]>(proposal.brands);
  const [items, setItems] = useState<DraftItem[]>(() =>
    proposal.items.length > 0
      ? proposal.items.map((item) => ({
          key: item.id,
          name: item.name,
          description: item.description,
          imageUrl: item.imageUrl,
          quantity: milliToInput(item.quantityMilli),
          unit: item.unit,
          dimensions: item.dimensions,
          unitPrice: minorToInput(item.unitPriceMinor, proposal.currency),
        }))
      : [newItem()]
  );

  // Mirrors the server's arithmetic so the manager sees the same figure the
  // document will carry; saveProposal recomputes it all from these raw
  // strings anyway, so this is display only.
  const lineTotals = useMemo(
    () =>
      items.map((item) => {
        const quantityMilli = parseQuantityToMilli(item.quantity) ?? 0;
        const priceMinor = parseMoneyToMinor(item.unitPrice) ?? 0;
        if (quantityMilli <= 0 || priceMinor < 0) return 0;
        return lineTotalMinor(quantityMilli, priceMinor);
      }),
    [items]
  );
  const grandTotal = lineTotals.reduce((sum, value) => sum + value, 0);

  function patchItem(index: number, patch: Partial<DraftItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function toggleBrand(brand: ProposalBrand) {
    setBrands((prev) =>
      prev.some((b) => b.name === brand.name)
        ? prev.filter((b) => b.name !== brand.name)
        : [...prev, brand]
    );
  }

  const templatesForLanguage = templates.filter(
    (template) => template.language === language
  );

  function handleSubmit(formData: FormData) {
    formData.set("itemsJson", JSON.stringify(items));
    formData.set("brandsJson", JSON.stringify(brands));
    setSaved(false);
    startTransition(async () => {
      await saveProposal(proposal.id, formData);
      setSaved(true);
    });
  }

  return (
    <form action={handleSubmit} className="mt-6 flex flex-col gap-6">
      <FormSection
        title="Основное"
        description="Номер и дата попадают в шапку документа"
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Номер КП">
            <input
              value={proposal.number}
              readOnly
              className={`${inputClass} bg-navy/[0.03] font-mono text-navy/60`}
            />
          </Field>
          <Field label="Дата">
            <input
              type="date"
              name="proposalDate"
              defaultValue={proposal.proposalDate}
              className={inputClass}
            />
          </Field>
          <Field label="Язык документа">
            <select
              name="language"
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value as ProposalLanguage)
              }
              className={inputClass}
            >
              {PROPOSAL_LANGUAGES.map((code) => (
                <option key={code} value={code}>
                  {PROPOSAL_LANGUAGE_LABELS[code]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Валюта">
            <select
              name="currency"
              value={currency}
              onChange={(e) =>
                setCurrency(e.target.value as ProposalCurrency)
              }
              className={inputClass}
            >
              {PROPOSAL_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Название проекта">
            <input
              name="projectName"
              defaultValue={proposal.projectName}
              placeholder="Квартира на Олмазоре"
              className={inputClass}
            />
          </Field>
          <Field label="Срок изготовления">
            <input
              name="deadline"
              defaultValue={proposal.deadline}
              placeholder="30 рабочих дней"
              className={inputClass}
            />
          </Field>
          <Field label="Статус">
            <select
              name="status"
              defaultValue={proposal.status}
              className={inputClass}
            >
              {PROPOSAL_STATUSES.map((status: ProposalStatus) => (
                <option key={status} value={status}>
                  {PROPOSAL_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Примечание к цене">
            <input
              name="validityNote"
              defaultValue={proposal.validityNote}
              placeholder="Цены действительны 10 дней"
              className={inputClass}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Цвет оформления"
        description="Акцент применяется к заголовкам, линиям и итоговому блоку"
      >
        <input type="hidden" name="themeColor" value={themeColor} />
        <div className="flex flex-wrap items-center gap-3">
          {PROPOSAL_THEMES.map((theme) => {
            const active =
              normalizeHex(themeColor) === normalizeHex(theme.color);
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setThemeColor(theme.color)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-navy bg-navy/5 text-navy"
                    : "border-navy/10 text-navy/60 hover:bg-navy/5"
                }`}
              >
                <span
                  className="h-3.5 w-3.5 rounded-full"
                  style={{ background: theme.color }}
                />
                {theme.label}
              </button>
            );
          })}
          <label className="flex items-center gap-2 rounded-full border border-navy/10 px-3 py-1.5 text-xs font-medium text-navy/60">
            Свой цвет
            <input
              type="color"
              value={normalizeHex(themeColor)}
              onChange={(e) => setThemeColor(e.target.value.toUpperCase())}
              className="h-5 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
            />
            <span className="font-mono text-[11px] text-navy/40">
              {normalizeHex(themeColor)}
            </span>
          </label>
        </div>
      </FormSection>

      <FormSection
        title="Заказчик и ответственный"
        description="Пустые поля в документ не попадут"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Клиент из базы">
            <select
              name="customerId"
              value={customerId}
              onChange={(e) => {
                const id = e.target.value;
                setCustomerId(id);
                const found = customers.find((c) => c.id === id);
                if (found) {
                  setClientName(found.name);
                  setClientPhone(found.phone);
                }
              }}
              className={inputClass}
            >
              <option value="">— не привязан —</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} · {customer.phone}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Имя заказчика">
            <input
              name="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Кудрат ака"
              className={inputClass}
            />
          </Field>
          <Field label="Телефон заказчика">
            <input
              name="clientPhone"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="+998 99 315 22 11"
              className={inputClass}
            />
          </Field>
          <Field label="Компания заказчика">
            <input
              name="clientCompany"
              defaultValue={proposal.clientCompany}
              className={inputClass}
            />
          </Field>
          <Field label="Адрес заказчика">
            <input
              name="clientAddress"
              defaultValue={proposal.clientAddress}
              placeholder="Бунёдкор махалла"
              className={inputClass}
            />
          </Field>
          <Field label="КП подготовил">
            <input
              name="preparedByName"
              defaultValue={proposal.preparedByName}
              className={inputClass}
            />
          </Field>
          <Field label="Телефон ответственного">
            <input
              name="preparedByPhone"
              defaultValue={proposal.preparedByPhone}
              placeholder="+998 70 131 50 00"
              className={inputClass}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Партнёры проекта"
        description="Бренды берутся из справочника на странице «О нас» и главной"
      >
        {brandDirectory.length === 0 ? (
          <p className="text-xs text-navy/40">
            Справочник брендов пуст — добавьте блок «Бренды» в разделе
            «Страницы».
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {brandDirectory.map((brand) => {
              const active = brands.some((b) => b.name === brand.name);
              return (
                <button
                  key={brand.name}
                  type="button"
                  onClick={() => toggleBrand(brand)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    active
                      ? "border-navy bg-navy/5 text-navy"
                      : "border-navy/10 text-navy/50 hover:bg-navy/5"
                  }`}
                >
                  {brand.logoUrl ? (
                    <img
                      src={brand.logoUrl}
                      alt=""
                      className="h-5 w-auto max-w-[70px] object-contain"
                    />
                  ) : null}
                  {brand.name}
                </button>
              );
            })}
          </div>
        )}
      </FormSection>

      <FormSection
        title="Изделия"
        description="Сумма позиции считается автоматически: количество × цена"
      >
        <div className="flex flex-col gap-4">
          {items.map((item, index) => (
            <div
              key={item.key}
              className="rounded-xl border border-navy/10 bg-navy/[0.015] p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-navy/40">
                  Позиция {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    aria-label="Выше"
                    className="rounded-md px-2 py-1 text-navy/40 transition hover:bg-navy/5 hover:text-navy disabled:opacity-25"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, 1)}
                    disabled={index === items.length - 1}
                    aria-label="Ниже"
                    className="rounded-md px-2 py-1 text-navy/40 transition hover:bg-navy/5 hover:text-navy disabled:opacity-25"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setItems((prev) => prev.filter((_, i) => i !== index))
                    }
                    aria-label="Удалить позицию"
                    className="rounded-md p-1.5 text-navy/40 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
                <ImageDropField
                  value={item.imageUrl}
                  onChange={(url) => patchItem(index, { imageUrl: url })}
                />

                <div className="flex flex-col gap-4">
                  <Field label="Название изделия">
                    <input
                      value={item.name}
                      onChange={(e) =>
                        patchItem(index, { name: e.target.value })
                      }
                      placeholder='Гостиная «Декор ТВ зона»'
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Описание">
                    <textarea
                      value={item.description}
                      onChange={(e) =>
                        patchItem(index, { description: e.target.value })
                      }
                      rows={4}
                      placeholder={"Корпус: MDF\nФасад: шпон\nМатериал: Egger\nФурнитура: Blum"}
                      className={`${inputClass} resize-y font-sans`}
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Количество">
                      <input
                        value={item.quantity}
                        onChange={(e) =>
                          patchItem(index, { quantity: e.target.value })
                        }
                        inputMode="decimal"
                        placeholder="12.5"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Единица">
                      <select
                        value={item.unit}
                        onChange={(e) =>
                          patchItem(index, {
                            unit: e.target.value as ProposalUnit,
                          })
                        }
                        className={inputClass}
                      >
                        {PROPOSAL_UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {UNIT_ADMIN_LABELS[unit]}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Размеры">
                      <input
                        value={item.dimensions}
                        onChange={(e) =>
                          patchItem(index, { dimensions: e.target.value })
                        }
                        placeholder="2200 × 600 × 2400 мм"
                        className={inputClass}
                      />
                    </Field>
                    <Field label={`Цена за единицу, ${currency}`}>
                      <input
                        value={item.unitPrice}
                        onChange={(e) =>
                          patchItem(index, { unitPrice: e.target.value })
                        }
                        inputMode="decimal"
                        placeholder="3 600 000"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <div className="flex items-center justify-end gap-2 border-t border-navy/10 pt-3">
                    <span className="text-xs text-navy/40">Сумма позиции</span>
                    <span className="text-sm font-semibold text-navy">
                      {formatMoney(lineTotals[index] ?? 0, currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-navy/10 pt-4">
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, newItem()])}
            className="rounded-full border border-navy/15 px-4 py-2 text-sm font-medium text-navy transition hover:bg-navy/5"
          >
            + Добавить изделие
          </button>
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-medium uppercase tracking-wide text-navy/40">
              Общая сумма
            </span>
            <span className="font-heading text-xl font-bold text-navy">
              {formatMoney(grandTotal, currency)}
            </span>
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Финальный текст и подпись"
        description="Текст из библиотеки можно править — шаблон при этом не изменится"
      >
        {templatesForLanguage.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {templatesForLanguage.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setFinalText(template.text)}
                className="rounded-full border border-navy/10 px-3 py-1.5 text-xs font-medium text-navy/60 transition hover:bg-navy/5 hover:text-navy"
              >
                {template.name}
              </button>
            ))}
          </div>
        )}
        <Field label="Финальный текст">
          <textarea
            name="finalText"
            value={finalText}
            onChange={(e) => setFinalText(e.target.value)}
            rows={3}
            placeholder="Спасибо за доверие! Мы будем рады реализовать этот проект для вас."
            className={`${inputClass} resize-y`}
          />
        </Field>
        <p className="text-xs text-navy/40">
          Место для подписи добавляется в документ автоматически.{" "}
          <Link
            href="/admin/proposals/templates"
            className="font-medium text-navy/60 underline hover:text-navy"
          >
            Управлять библиотекой текстов
          </Link>
        </p>
      </FormSection>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy/10 bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="text-sm text-navy/50">
          {saved && !pending ? (
            <span className="font-medium text-emerald-600">Сохранено</span>
          ) : (
            <>
              Итог:{" "}
              <span className="font-semibold text-navy">
                {formatMoney(grandTotal, currency)}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/proposals/${proposal.id}/preview`}
            className="rounded-full border border-navy/15 px-4 py-2.5 text-sm font-medium text-navy transition hover:bg-navy/5"
          >
            Предпросмотр и PDF
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy/90 disabled:opacity-50"
          >
            {pending ? "Сохраняем…" : "Сохранить"}
          </button>
        </div>
      </div>
    </form>
  );
}
