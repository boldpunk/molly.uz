import { describe, expect, it } from "vitest";
import { decodeProject, encodeProject, fitNiche } from "./wardrobe-project";

describe("wardrobe project links", () => {
  it("round-trips a configuration", () => {
    const project = {
      layout: ["drawers", "hanging", "shelves", "combo"] as const,
      finish: "abc-123",
      mirror: "all" as const,
      rails: false,
      handle: "врезные" as const,
      hinge: "higold" as const,
    };
    const query = encodeProject({ ...project, layout: [...project.layout] });
    const params = Object.fromEntries(new URLSearchParams(query));
    expect(decodeProject(params)).toEqual({ ...project, layout: [...project.layout] });
  });

  it("ignores malformed values", () => {
    expect(decodeProject({ s: "dxq", m: "sideways", r: "yes", h: "gold", g: "acme" })).toEqual({});
    expect(decodeProject({ s: "d" })).toEqual({});
    expect(decodeProject({ s: "sssssssss" })).toEqual({});
  });
});

describe("fitNiche", () => {
  it("fills a niche with whole modules", () => {
    expect(fitNiche(2400, 366)).toEqual({ modules: 6, leftoverMm: 204, fits: true });
  });
  it("caps at the largest wardrobe", () => {
    expect(fitNiche(4000, 366).modules).toBe(8);
  });
  it("flags niches narrower than two modules", () => {
    expect(fitNiche(600, 366).fits).toBe(false);
  });
});
