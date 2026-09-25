import { describe, it, expect } from "vitest";
import {
  clampLogoScale,
  LOGO_SCALE_MIN,
  LOGO_SCALE_MAX,
  LOGO_SCALE_DEFAULT,
} from "./brand-config";

describe("clampLogoScale", () => {
  it("keeps the slider inside its range", () => {
    expect(clampLogoScale(100)).toBe(100);
    expect(clampLogoScale(10)).toBe(LOGO_SCALE_MIN);
    expect(clampLogoScale(400)).toBe(LOGO_SCALE_MAX);
  });

  it("falls back on values that aren't numbers", () => {
    expect(clampLogoScale(Number.NaN)).toBe(LOGO_SCALE_DEFAULT);
    expect(clampLogoScale(Number("не число"))).toBe(LOGO_SCALE_DEFAULT);
  });

  it("rounds to whole percent", () => {
    expect(clampLogoScale(87.4)).toBe(87);
  });
});
