import { describe, expect, it } from "vitest";
import { matchesQuery } from "./search-match";

describe("matchesQuery", () => {
  const fields = ["Уголок Queen", "Угловой модульный диван", "Мягкая мебель", "Синий"];
  it("matches every word in any order and case", () => {
    expect(matchesQuery("синий queen", fields)).toBe(true);
    expect(matchesQuery("ДИВАН", fields)).toBe(true);
  });
  it("needs all words", () => {
    expect(matchesQuery("диван кухня", fields)).toBe(false);
  });
  it("treats ё as е", () => {
    expect(matchesQuery("зелёный", ["Зеленый фасад"])).toBe(true);
  });
  it("ignores an empty query", () => {
    expect(matchesQuery("   ", fields)).toBe(false);
  });
});
