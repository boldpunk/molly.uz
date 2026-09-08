"use client";

import { useState } from "react";
import { FormSection } from "./form-section";
import { BlockImageField, StatListFields } from "./page-blocks-editor";
import type { PageBlock } from "@/db/schema";

function pick<T extends PageBlock["type"]>(
  blocks: PageBlock[],
  index: number,
  type: T
): Extract<PageBlock, { type: T }> | undefined {
  const b = blocks[index];
  return b && b.type === type ? (b as Extract<PageBlock, { type: T }>) : undefined;
}

export function HomeContentForm({
  name,
  initialBlocks,
}: {
  name: string;
  initialBlocks: PageBlock[];
}) {
  const [heroHeading, setHeroHeading] = useState(
    pick(initialBlocks, 0, "heading")?.text ?? ""
  );
  const [heroSubtitle, setHeroSubtitle] = useState(
    pick(initialBlocks, 1, "paragraph")?.text ?? ""
  );
  const [heroImage, setHeroImage] = useState(() => {
    const b = pick(initialBlocks, 2, "image");
    return { url: b?.url ?? "", alt: b?.alt ?? "" };
  });
  const [uspStats, setUspStats] = useState(
    pick(initialBlocks, 3, "stat_list")?.items ?? []
  );
  const [brandHeading, setBrandHeading] = useState(
    pick(initialBlocks, 4, "heading")?.text ?? ""
  );
  const [brandParagraph, setBrandParagraph] = useState(
    pick(initialBlocks, 5, "paragraph")?.text ?? ""
  );
  const [brandImage, setBrandImage] = useState(() => {
    const b = pick(initialBlocks, 6, "image");
    return { url: b?.url ?? "", alt: b?.alt ?? "" };
  });

  const blocks: PageBlock[] = [
    { type: "heading", text: heroHeading },
    { type: "paragraph", text: heroSubtitle },
    { type: "image", url: heroImage.url, alt: heroImage.alt },
    { type: "stat_list", items: uspStats },
    { type: "heading", text: brandHeading },
    { type: "paragraph", text: brandParagraph },
    { type: "image", url: brandImage.url, alt: brandImage.alt },
  ];

  return (
    <div className="flex flex-col gap-6">
      <input type="hidden" name={name} value={JSON.stringify(blocks)} />

      <FormSection
        title="Главный экран"
        description="Заголовок, подзаголовок и фото в верхней части главной страницы"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-navy">Заголовок</span>
          <input
            value={heroHeading}
            onChange={(e) => setHeroHeading(e.target.value)}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-navy">Подзаголовок</span>
          <textarea
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            rows={2}
            className="input"
          />
        </label>
        <div>
          <span className="text-sm font-medium text-navy">Фото</span>
          <div className="mt-1.5">
            <BlockImageField
              block={{ type: "image", ...heroImage }}
              onChange={(b) => {
                if (b.type === "image") setHeroImage({ url: b.url, alt: b.alt });
              }}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title="Показатели (USP)"
        description="Короткие характеристики под главным экраном — можно добавлять и удалять"
      >
        <StatListFields
          block={{ type: "stat_list", items: uspStats }}
          onChange={(b) => {
            if (b.type === "stat_list") setUspStats(b.items);
          }}
        />
      </FormSection>

      <FormSection
        title="О бренде"
        description="Блок с заголовком, текстом и фото перед подвалом"
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-navy">Заголовок</span>
          <input
            value={brandHeading}
            onChange={(e) => setBrandHeading(e.target.value)}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-navy">Текст</span>
          <textarea
            value={brandParagraph}
            onChange={(e) => setBrandParagraph(e.target.value)}
            rows={4}
            className="input"
          />
        </label>
        <div>
          <span className="text-sm font-medium text-navy">Фото</span>
          <div className="mt-1.5">
            <BlockImageField
              block={{ type: "image", ...brandImage }}
              onChange={(b) => {
                if (b.type === "image") setBrandImage({ url: b.url, alt: b.alt });
              }}
            />
          </div>
        </div>
      </FormSection>
    </div>
  );
}
