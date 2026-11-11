// One-off: the measurement is no longer advertised as free. Rewrites that
// wording in page content and products, printing every change.
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const RULES = [
  [/Бесплатный замер, доставка и сборка/g, "Замер, доставка и сборка"],
  [/Замерщик приезжает бесплатно и /g, "Замерщик приезжает и "],
  [/\s*—\s*выезд замерщика бесплатный\./g, "."],
  [/Бесплатно выезжаем/g, "Выезжаем"],
  [/Бесплатный замер/g, "Заказать замер"],
  [/бесплатный замер/g, "замер"],
  [/бесплатного замера/g, "замера"],
  [/бесплатный выезд замерщика/g, "выезд замерщика"],
];
const changes = [];
const leftovers = [];

function fixString(s, where) {
  let out = s;
  for (const [re, to] of RULES) out = out.replace(re, to);
  if (out !== s) changes.push(`${where}\n    было:  ${s}\n    стало: ${out}`);
  if (/бесплатн/i.test(out)) leftovers.push(`${where}: ${out}`);
  return out;
}

function walk(value, where) {
  if (typeof value === "string") return fixString(value, where);
  if (Array.isArray(value)) return value.map((v, i) => walk(v, `${where}[${i}]`));
  if (value && typeof value === "object") {
    // A stat whose value is just «бесплатно» (e.g. Замер — бесплатно).
    if (typeof value.value === "string" && /^бесплатно$/i.test(value.value.trim())) {
      changes.push(`${where}\n    было:  ${value.label}: ${value.value}\n    стало: ${value.label}: выезд на объект`);
      value = { ...value, value: "выезд на объект" };
    }
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walk(v, `${where}.${k}`)]));
  }
  return value;
}

const pages = await sql`select slug, title, blocks, meta_title, meta_description from pages`;
for (const p of pages) {
  const next = {
    title: walk(p.title, `pages/${p.slug}.title`),
    blocks: walk(p.blocks, `pages/${p.slug}.blocks`),
    meta_title: walk(p.meta_title, `pages/${p.slug}.meta_title`),
    meta_description: walk(p.meta_description, `pages/${p.slug}.meta_description`),
  };
  if (JSON.stringify(next) !== JSON.stringify({ title: p.title, blocks: p.blocks, meta_title: p.meta_title, meta_description: p.meta_description })) {
    // Keep the old text restorable from the page editor's history.
    await sql`insert into page_revisions (page_slug, title, blocks, meta_title, meta_description, saved_by) values (${p.slug}, ${p.title}, ${JSON.stringify(p.blocks)}::jsonb, ${p.meta_title}, ${p.meta_description}, ${"Скрипт: убрали «бесплатный замер»"})`;
    await sql`update pages set title = ${next.title}, blocks = ${JSON.stringify(next.blocks)}::jsonb, meta_title = ${next.meta_title}, meta_description = ${next.meta_description}, updated_at = now() where slug = ${p.slug}`;
  }
}

const products = await sql`select id, slug, spec_line, description, attributes, meta_description from products`;
for (const p of products) {
  const next = {
    spec_line: walk(p.spec_line, `products/${p.slug}.spec_line`),
    description: walk(p.description, `products/${p.slug}.description`),
    attributes: walk(p.attributes, `products/${p.slug}.attributes`),
    meta_description: walk(p.meta_description, `products/${p.slug}.meta_description`),
  };
  if (JSON.stringify(next) !== JSON.stringify({ spec_line: p.spec_line, description: p.description, attributes: p.attributes, meta_description: p.meta_description })) {
    await sql`update products set spec_line = ${next.spec_line}, description = ${next.description}, attributes = ${JSON.stringify(next.attributes)}::jsonb, meta_description = ${next.meta_description} where id = ${p.id}`;
  }
}

console.log(`Изменено строк: ${changes.length}\n`);
for (const c of changes) console.log(`• ${c}\n`);
console.log(leftovers.length ? `Осталось со словом «бесплатн»:\n${leftovers.join("\n")}` : "Слова «бесплатн» в страницах и товарах больше нет.");
