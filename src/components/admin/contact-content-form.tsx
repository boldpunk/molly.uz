"use client";

import { useState } from "react";
import { FormSection } from "./form-section";
import type { PageBlock } from "@/db/schema";

function pick<T extends PageBlock["type"]>(
  blocks: PageBlock[],
  index: number,
  type: T
): Extract<PageBlock, { type: T }> | undefined {
  const b = blocks[index];
  return b && b.type === type ? (b as Extract<PageBlock, { type: T }>) : undefined;
}

export function ContactContentForm({
  name,
  initialBlocks,
}: {
  name: string;
  initialBlocks: PageBlock[];
}) {
  const [heading, setHeading] = useState(
    pick(initialBlocks, 0, "heading")?.text ?? ""
  );
  const [subtitle, setSubtitle] = useState(
    pick(initialBlocks, 1, "paragraph")?.text ?? ""
  );
  const initialContact = pick(initialBlocks, 2, "contact_info");
  const [phone, setPhone] = useState(initialContact?.phone ?? "");
  const [email, setEmail] = useState(initialContact?.email ?? "");
  const [hours, setHours] = useState(initialContact?.hours ?? "");
  const [telegram, setTelegram] = useState(initialContact?.telegram ?? "");
  const [instagram, setInstagram] = useState(initialContact?.instagram ?? "");
  const [address, setAddress] = useState(initialContact?.address ?? "");
  const [addressNote, setAddressNote] = useState(
    initialContact?.addressNote ?? ""
  );
  const [mapLat, setMapLat] = useState(
    String(initialContact?.mapLat ?? 41.2995)
  );
  const [mapLng, setMapLng] = useState(
    String(initialContact?.mapLng ?? 69.2401)
  );

  const blocks: PageBlock[] = [
    { type: "heading", text: heading },
    { type: "paragraph", text: subtitle },
    {
      type: "contact_info",
      phone,
      email,
      hours,
      telegram,
      instagram,
      address,
      addressNote,
      mapLat: Number(mapLat) || 0,
      mapLng: Number(mapLng) || 0,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <input type="hidden" name={name} value={JSON.stringify(blocks)} />

      <FormSection
        title="Заголовок страницы"
        description="Заголовок и подзаголовок вверху страницы контактов"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-navy">Заголовок</span>
          <input
            value={heading}
            onChange={(e) => setHeading(e.target.value)}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-navy">Подзаголовок</span>
          <textarea
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            rows={2}
            className="input"
          />
        </label>
      </FormSection>

      <FormSection
        title="Телефон"
        description="Номер и часы работы — отображаются в карточке «Телефон»"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-navy">Номер телефона</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 00 000 00 00"
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-navy">Часы работы</span>
          <input
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="Пн–Сб: 09:00–19:00 · Вс: выходной"
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-navy">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="info@molly.uz"
            className="input"
          />
        </label>
      </FormSection>

      <FormSection
        title="Мессенджеры"
        description="Только имя пользователя, без ссылки — например mollyhomeuzbot"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-navy">Telegram</span>
          <input
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            placeholder="mollyhomeuzbot"
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-navy">Instagram</span>
          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="molly_home.uz"
            className="input"
          />
        </label>
      </FormSection>

      <FormSection
        title="Адрес и карта"
        description="Координаты можно скопировать из Google Maps (правая кнопка мыши на точке → координаты)"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-navy">Адрес</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ташкент, Узбекистан"
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-navy">Примечание к адресу</span>
          <input
            value={addressNote}
            onChange={(e) => setAddressNote(e.target.value)}
            placeholder="Работаем по всему Ташкенту и области — выезд замерщика бесплатный."
            className="input"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-navy">Широта (lat)</span>
            <input
              value={mapLat}
              onChange={(e) => setMapLat(e.target.value)}
              inputMode="decimal"
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-navy">Долгота (lng)</span>
            <input
              value={mapLng}
              onChange={(e) => setMapLng(e.target.value)}
              inputMode="decimal"
              className="input"
            />
          </label>
        </div>
      </FormSection>
    </div>
  );
}
