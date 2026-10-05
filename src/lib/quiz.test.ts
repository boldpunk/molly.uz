import { describe, expect, it } from "vitest";
import { moodOf, recommend } from "./quiz";
import type { Product } from "./types";

describe("moodOf", () => {
  it("sorts typical furniture finishes", () => {
    expect(moodOf("#f2efe9")).toBe("light");
    expect(moodOf("#1c1c1c")).toBe("dark");
    expect(moodOf("#8a8f96")).toBe("light");
    expect(moodOf("#4a4d52")).toBe("dark");
    expect(moodOf("#a87c55")).toBe("wood");
    expect(moodOf("#9bab8f")).toBe("accent");
    expect(moodOf("#c2714f")).toBe("accent");
    expect(moodOf("#2f6db5")).toBe("accent");
  });
  it("ignores malformed colours", () => {
    expect(moodOf("red")).toBeNull();
  });
});

function product(slug: string, categorySlug: string, swatches: string[], extra: Partial<Product> = {}): Product {
  return {
    id: slug,
    categoryId: categorySlug,
    categorySlug,
    slug,
    name: slug,
    specLine: "",
    description: "",
    pricingMode: "on_request",
    attributes: [],
    isSample: false,
    galleryUrls: [],
    colourOptions: swatches.map((swatch, i) => ({ id: `${slug}-${i}`, label: swatch, swatch })),
    ...extra,
  };
}

describe("recommend", () => {
  const products = [
    product("dark-kitchen", "kuhonnaya-mebel", ["#1c1c1c", "#3a3d42"]),
    product("light-kitchen", "kuhonnaya-mebel", ["#f2efe9", "#e6dccd"]),
    product("sofa", "myagkaya-mebel", ["#f2efe9"]),
  ];
  it("keeps to the chosen room and ranks by mood", () => {
    expect(recommend(products, "kitchen", "light").map((p) => p.slug)).toEqual(["light-kitchen", "dark-kitchen"]);
    expect(recommend(products, "kitchen", "dark")[0].slug).toBe("dark-kitchen");
  });
  it("returns nothing for a room without products", () => {
    expect(recommend(products, "wardrobe", "light")).toEqual([]);
  });
});
