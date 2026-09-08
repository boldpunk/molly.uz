"use server";

import { put, del } from "@vercel/blob";

const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function uploadProductImage(
  formData: FormData
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

  const blob = await put(`products/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return { url: blob.url };
}

export async function deleteProductImage(url: string): Promise<void> {
  if (!url.includes("blob.vercel-storage.com")) return;
  try {
    await del(url);
  } catch {
    // best-effort cleanup — stale blobs don't break the site
  }
}
