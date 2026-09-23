"use server";

import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
// Uploaded photos are served as-is (see src/lib/image-src.ts — they skip
// Next's image optimizer), so cap the dimensions here instead.
const MAX_DIMENSION = 2400;

// Uploaded files live under public/uploads so Next.js serves them the same
// way it serves any other file in public/ — no separate static route needed.
// In the Docker image this directory is a mounted volume so uploads survive
// deploys (the rest of public/ is baked into the image at build time).
const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");

function sanitizeBaseName(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9.\-]/g, "_");
  return base || "file";
}

async function uploadImage(
  formData: FormData,
  folder: string
): Promise<{ url: string } | { error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Файл не выбран." };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Поддерживаются только JPEG, PNG, WebP и AVIF." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { error: "Файл слишком большой (максимум 8 МБ)." };
  }

  const ext = path.extname(file.name) || "";
  const base = sanitizeBaseName(path.basename(file.name, ext));
  const suffix = randomBytes(8).toString("hex");
  const filename = `${base}-${suffix}${ext}`;

  const dir = path.join(/* turbopackIgnore: true */ UPLOAD_DIR, folder);
  await mkdir(dir, { recursive: true });
  const original = Buffer.from(await file.arrayBuffer());
  const resized = await sharp(original)
    .rotate()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toBuffer();
  await writeFile(path.join(/* turbopackIgnore: true */ dir, filename), resized);

  return { url: `/uploads/${folder}/${filename}` };
}

export async function uploadProductImage(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  return uploadImage(formData, "products");
}

// An SVG served from our own origin is a script execution context when opened
// directly, so anything that could carry behaviour or phone out is rejected
// outright rather than stripped — a logo never needs any of it.
const SVG_FORBIDDEN = [
  /<\s*script/i,
  /<\s*foreignObject/i,
  /<\s*iframe/i,
  /<\s*embed/i,
  /<\s*object/i,
  /\son\w+\s*=/i,
  /javascript:/i,
  /<!ENTITY/i,
  /(href|xlink:href|src)\s*=\s*["']?\s*(https?:)?\/\//i,
];

export async function uploadBrandAsset(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Файл не выбран." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { error: "Файл слишком большой (максимум 8 МБ)." };
  }

  const isSvg =
    file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");
  if (!isSvg) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: "Поддерживаются SVG, PNG, WebP и JPEG." };
    }
    return uploadImage(formData, "brand");
  }

  const markup = await file.text();
  if (!/<\s*svg[\s>]/i.test(markup)) {
    return { error: "Это не похоже на SVG-файл." };
  }
  if (SVG_FORBIDDEN.some((pattern) => pattern.test(markup))) {
    return {
      error:
        "В SVG есть скрипты, внешние ссылки или обработчики событий — такой файл загрузить нельзя.",
    };
  }

  const suffix = randomBytes(8).toString("hex");
  const base = sanitizeBaseName(path.basename(file.name, ".svg"));
  const dir = path.join(/* turbopackIgnore: true */ UPLOAD_DIR, "brand");
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(/* turbopackIgnore: true */ dir, `${base}-${suffix}.svg`),
    markup,
    "utf8"
  );

  return { url: `/uploads/brand/${base}-${suffix}.svg` };
}

export async function uploadProposalImage(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  return uploadImage(formData, "proposals");
}

export async function uploadPageImage(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  return uploadImage(formData, "pages");
}

export async function deleteProductImage(url: string): Promise<void> {
  if (!url.startsWith("/uploads/")) return;
  const target = path.join(
    /* turbopackIgnore: true */ UPLOAD_DIR,
    url.slice("/uploads/".length)
  );
  if (!target.startsWith(UPLOAD_DIR + path.sep)) return;
  try {
    await unlink(target);
  } catch {
    // best-effort cleanup — stale files don't break the site
  }
}
