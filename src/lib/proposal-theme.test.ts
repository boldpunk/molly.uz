import { describe, it, expect } from "vitest";
import {
  normalizeHex,
  contrastText,
  readableAccent,
  withAlpha,
  PROPOSAL_THEMES,
} from "./proposal-theme";

describe("normalizeHex", () => {
  it("accepts the shapes a colour picker produces", () => {
    expect(normalizeHex("#c08a2e")).toBe("#C08A2E");
    expect(normalizeHex("c08a2e")).toBe("#C08A2E");
    expect(normalizeHex("#abc")).toBe("#AABBCC");
    expect(normalizeHex("  #C08A2E  ")).toBe("#C08A2E");
  });

  it("falls back rather than emitting an invalid colour", () => {
    expect(normalizeHex("не цвет")).toBe("#C08A2E");
    expect(normalizeHex("")).toBe("#C08A2E");
  });
});

describe("contrastText", () => {
  it("keeps text readable on any accent a manager can pick", () => {
    expect(contrastText("#182B4C")).toBe("#FFFFFF");
    expect(contrastText("#2F6B4F")).toBe("#FFFFFF");
    expect(contrastText("#F9E8D8")).toBe("#1A1A1A");
    expect(contrastText("#FFFF00")).toBe("#1A1A1A");
  });

  it("covers every preset theme", () => {
    for (const theme of PROPOSAL_THEMES) {
      expect(["#FFFFFF", "#1A1A1A"]).toContain(contrastText(theme.color));
    }
  });
});

describe("readableAccent", () => {
  it("leaves dark accents alone and deepens pale ones", () => {
    expect(readableAccent("#182B4C")).toBe("#182B4C");
    expect(readableAccent("#F9E8D8")).not.toBe("#F9E8D8");
  });
});

describe("withAlpha", () => {
  it("builds an rgba from a hex", () => {
    expect(withAlpha("#182B4C", 0.5)).toBe("rgba(24, 43, 76, 0.5)");
  });
});
