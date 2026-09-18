import { eq } from "drizzle-orm";
import { db } from "@/db";
import { employees, telegramPendingActions } from "@/db/schema";
import {
  getCategories,
  getCategoryBySlug,
  getProductsByCategory,
  getProductById,
} from "./data";
import { getDisplayPrice } from "./pricing";
import { formatSum } from "./format";
import { SITE_URL } from "./site";
import type { Product } from "./types";
import {
  sendTelegramMessage,
  sendTelegramPhoto,
  escapeHtml,
  getStaffChatId,
  isStaffNotifyConfigured,
} from "./telegram";

const PAGE_SIZE = 6;

function siteLink(path: string, campaign: string): string {
  const url = new URL(path, SITE_URL);
  url.searchParams.set("utm_source", "telegram");
  url.searchParams.set("utm_medium", "bot");
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}

function absoluteImageUrl(imageUrl: string): string {
  return imageUrl.startsWith("http") ? imageUrl : `${SITE_URL}${imageUrl}`;
}

export async function sendCategoryList(chatId: number | string): Promise<void> {
  const categories = await getCategories();
  const rows = categories.map((c) => [
    { text: c.name, callback_data: `cat:c:${c.slug}:0` },
  ]);
  await sendTelegramMessage(chatId, "🛋 Выберите категорию:", {
    replyMarkup: { inline_keyboard: rows },
  });
}

export async function sendProductList(
  chatId: number | string,
  categorySlug: string,
  page: number
): Promise<void> {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) {
    await sendTelegramMessage(chatId, "Категория не найдена.");
    return;
  }

  if (category.isPlaceholder) {
    await sendTelegramMessage(
      chatId,
      `«${escapeHtml(category.name)}» — раздел пока наполняется, загляните позже.`,
      { replyMarkup: { inline_keyboard: [[{ text: "◀️ Категории", callback_data: "cat:root" }]] } }
    );
    return;
  }

  const products = await getProductsByCategory(category.id, category.slug);
  if (products.length === 0) {
    await sendTelegramMessage(
      chatId,
      `В категории «${escapeHtml(category.name)}» пока нет товаров.`,
      { replyMarkup: { inline_keyboard: [[{ text: "◀️ Категории", callback_data: "cat:root" }]] } }
    );
    return;
  }

  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const pageProducts = products.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  );

  const rows = pageProducts.map((p) => [
    { text: p.name, callback_data: `cat:p:${p.id}` },
  ]);

  const navRow: { text: string; callback_data: string }[] = [];
  if (safePage > 0) {
    navRow.push({ text: "⬅️ Назад", callback_data: `cat:c:${categorySlug}:${safePage - 1}` });
  }
  if (safePage < totalPages - 1) {
    navRow.push({ text: "Вперёд ➡️", callback_data: `cat:c:${categorySlug}:${safePage + 1}` });
  }
  if (navRow.length > 0) rows.push(navRow);
  rows.push([{ text: "◀️ Категории", callback_data: "cat:root" }]);

  const pageLabel = totalPages > 1 ? ` (стр. ${safePage + 1} из ${totalPages})` : "";
  await sendTelegramMessage(
    chatId,
    `🛋 ${escapeHtml(category.name)}${pageLabel}:`,
    { replyMarkup: { inline_keyboard: rows } }
  );
}

function formatProductCaption(product: Product): string {
  const lines = [`<b>${escapeHtml(product.name)}</b>`];
  if (product.specLine) lines.push(escapeHtml(product.specLine));
  const display = getDisplayPrice(product);
  if (display) {
    const priceLine = display.originalAmount
      ? `${formatSum(display.amount)} <s>${formatSum(display.originalAmount)}</s>`
      : `${formatSum(display.amount)}`;
    lines.push(`💵 ${priceLine}`);
  } else {
    lines.push("💬 Цена по запросу");
  }
  if (product.description) {
    lines.push("", escapeHtml(product.description).slice(0, 500));
  }
  return lines.join("\n");
}

export async function sendProductCard(
  chatId: number | string,
  productId: string
): Promise<void> {
  const product = await getProductById(productId);
  if (!product) {
    await sendTelegramMessage(chatId, "Товар не найден или снят с публикации.", {
      replyMarkup: { inline_keyboard: [[{ text: "◀️ Категории", callback_data: "cat:root" }]] },
    });
    return;
  }

  const caption = formatProductCaption(product);
  const keyboard = {
    inline_keyboard: [
      [
        {
          text: "🔗 Подробнее на сайте",
          url: siteLink(`/catalog/${product.categorySlug}/${product.slug}`, "catalog_card"),
        },
      ],
      [{ text: "❓ Задать вопрос", callback_data: `cat:ask:${product.id}` }],
      [{ text: "◀️ Назад", callback_data: "cat:root" }],
    ],
  };

  if (product.imageUrl) {
    await sendTelegramPhoto(chatId, absoluteImageUrl(product.imageUrl), caption, {
      replyMarkup: keyboard,
    });
  } else {
    await sendTelegramMessage(chatId, caption, { replyMarkup: keyboard });
  }
}

export async function startProductQuestion(
  chatId: number | string,
  productId: string
): Promise<void> {
  const product = await getProductById(productId);
  if (!product) return;
  await db
    .insert(telegramPendingActions)
    .values({
      key: `q:${chatId}`,
      kind: "product_question",
      payload: productId,
    })
    .onConflictDoUpdate({
      target: telegramPendingActions.key,
      set: { kind: "product_question", payload: productId },
    });
  await sendTelegramMessage(
    chatId,
    `Напишите ваш вопрос о товаре «${escapeHtml(product.name)}» следующим сообщением — я передам его менеджеру.`
  );
}

export async function consumeProductQuestion(
  chatId: number | string
): Promise<{ productName: string } | null> {
  const key = `q:${chatId}`;
  const [pending] = await db
    .select()
    .from(telegramPendingActions)
    .where(eq(telegramPendingActions.key, key))
    .limit(1);
  if (!pending || pending.kind !== "product_question" || !pending.payload) return null;

  await db.delete(telegramPendingActions).where(eq(telegramPendingActions.key, key));

  const product = await getProductById(pending.payload);
  return product ? { productName: product.name } : null;
}

export async function relayProductQuestion(
  chatId: number | string,
  fromLabel: string,
  productName: string,
  question: string
): Promise<void> {
  if (!isStaffNotifyConfigured()) return;
  const text = `❓ Вопрос по товару «${escapeHtml(productName)}»\nОт: ${escapeHtml(
    fromLabel
  )}\n\n${escapeHtml(question)}`;

  const staffChatId = getStaffChatId();
  if (staffChatId) await sendTelegramMessage(staffChatId, text);

  const recipients = await db.select({ telegramId: employees.telegramId }).from(employees);
  await Promise.all(
    recipients
      .filter((r) => /^\d+$/.test(r.telegramId))
      .map((r) => sendTelegramMessage(r.telegramId, text))
  );
}
