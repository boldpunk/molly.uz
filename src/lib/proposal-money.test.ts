import { describe, it, expect } from "vitest";
import {
  parseMoneyToMinor,
  parseQuantityToMilli,
  lineTotalMinor,
  formatMoney,
  formatQuantity,
  minorToInput,
  milliToInput,
} from "./proposal-money";

// These figures end up on a document a customer is quoted from, so the
// arithmetic is pinned down rather than trusted.

describe("parseMoneyToMinor", () => {
  it("accepts what a manager actually types", () => {
    expect(parseMoneyToMinor("3 600 000")).toBe(360000000);
    expect(parseMoneyToMinor("1250.50")).toBe(125050);
    expect(parseMoneyToMinor("1250,50")).toBe(125050);
    expect(parseMoneyToMinor("1 250")).toBe(125000);
  });

  it("keeps only two decimals", () => {
    expect(parseMoneyToMinor("10.999")).toBe(1099);
  });

  it("separates empty from zero", () => {
    expect(parseMoneyToMinor("")).toBeNull();
    expect(parseMoneyToMinor("   ")).toBeNull();
    expect(parseMoneyToMinor("abc")).toBeNull();
    expect(parseMoneyToMinor("0")).toBe(0);
  });
});

describe("parseQuantityToMilli", () => {
  it("handles fractional units", () => {
    expect(parseQuantityToMilli("12.5")).toBe(12500);
    expect(parseQuantityToMilli("5,5")).toBe(5500);
    expect(parseQuantityToMilli("1")).toBe(1000);
    expect(parseQuantityToMilli(".5")).toBe(500);
  });
});

describe("lineTotalMinor", () => {
  it("multiplies quantity by unit price", () => {
    // 2 п.м. × 3 600 000 = 7 200 000 (the worked example from the spec)
    expect(lineTotalMinor(2000, 360000000)).toBe(720000000);
    expect(lineTotalMinor(1000, 305000)).toBe(305000);
    expect(lineTotalMinor(12500, 30450)).toBe(380625);
  });

  it("stays exact past Number.MAX_SAFE_INTEGER in the intermediate", () => {
    // 12.5 × 15 000 000 000 so'm: the naive product overflows a double, so
    // the multiply has to happen in BigInt.
    const quantityMilli = 12500;
    const priceMinor = 1_500_000_000_000;
    expect(quantityMilli * priceMinor).toBeGreaterThan(Number.MAX_SAFE_INTEGER);
    expect(lineTotalMinor(quantityMilli, priceMinor)).toBe(18_750_000_000_000);
  });

  it("rounds halves up rather than drifting", () => {
    expect(lineTotalMinor(1, 1)).toBe(0);
    expect(lineTotalMinor(500, 1)).toBe(1);
    expect(lineTotalMinor(1500, 1)).toBe(2);
  });
});

describe("formatMoney", () => {
  it("shows whole so'm and two decimals for hard currency", () => {
    expect(formatMoney(360000000, "UZS")).toBe("3 600 000 сум");
    expect(formatMoney(360000000, "UZS", { language: "uz" })).toBe(
      "3 600 000 so'm"
    );
    expect(formatMoney(305000, "USD")).toBe("3 050,00 $");
    expect(formatMoney(305000, "EUR")).toBe("3 050,00 €");
  });

  it("can omit the symbol", () => {
    expect(formatMoney(305000, "USD", { withSymbol: false })).toBe("3 050,00");
  });
});

describe("round trips", () => {
  it("re-renders a stored value as the input that produced it", () => {
    expect(minorToInput(125050, "USD")).toBe("1250.50");
    expect(minorToInput(360000000, "UZS")).toBe("3600000");
    expect(milliToInput(12500)).toBe("12.5");
    expect(formatQuantity(12500)).toBe("12,5");
  });
});
