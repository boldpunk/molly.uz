import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { categories, products } from "./seed-data";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  console.log("Clearing existing data...");
  await db.delete(schema.requestItems);
  await db.delete(schema.requests);
  await db.delete(schema.products);
  await db.delete(schema.categories);

  console.log("Inserting categories...");
  const categoryIdMap = new Map<string, string>();
  for (const cat of categories) {
    const [inserted] = await db
      .insert(schema.categories)
      .values({
        name: cat.name,
        slug: cat.slug,
        isPlaceholder: cat.isPlaceholder,
        sortOrder: cat.sortOrder,
        filterKind: cat.filterKind,
      })
      .returning({ id: schema.categories.id });
    categoryIdMap.set(cat.key, inserted.id);
  }

  console.log("Inserting products...");
  for (const p of products) {
    const categoryId = categoryIdMap.get(p.categoryKey);
    if (!categoryId) throw new Error(`Unknown category key: ${p.categoryKey}`);
    await db.insert(schema.products).values({
      categoryId,
      slug: p.slug,
      name: p.name,
      specLine: p.specLine,
      description: p.description,
      pricingMode: p.pricingMode,
      hardwareOptions: p.hardwareOptions,
      colourOptions: p.colourOptions,
      collection: p.collection,
      attributes: p.attributes,
      isSample: p.isSample ?? false,
      isFeatured: p.isFeatured ?? false,
    });
  }

  console.log(
    `Seeded ${categories.length} categories and ${products.length} products.`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
