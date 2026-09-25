import { describe, it, expect, beforeEach, vi } from "vitest";

// The guard reads the caller's IP from request headers; tests drive that
// directly so the per-IP limit can be exercised without a server.
let currentIp = "1.1.1.1";
vi.mock("next/headers", () => ({
  headers: async () => new Map([["x-forwarded-for", currentIp]]),
}));

const { guardRequestSubmission } = await import("./request-guard");

const valid = {
  name: "Кудрат ака",
  phone: "+998 90 123 45 67",
  notes: "Кухня 3 метра",
  items: [],
};

function uniquePhone() {
  return "+998 " + Math.floor(100000000 + Math.random() * 899999999);
}

beforeEach(() => {
  currentIp = "ip-" + Math.random().toString(36).slice(2);
});

describe("guardRequestSubmission", () => {
  it("accepts a normal submission and trims the name", async () => {
    const result = await guardRequestSubmission({
      ...valid,
      name: "  Кудрат   ака  ",
      phone: uniquePhone(),
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.name).toBe("Кудрат ака");
  });

  it("rejects a name that is too short or too long", async () => {
    expect(
      (await guardRequestSubmission({ ...valid, name: "A", phone: uniquePhone() })).ok
    ).toBe(false);
    expect(
      (await guardRequestSubmission({
        ...valid,
        name: "я".repeat(81),
        phone: uniquePhone(),
      })).ok
    ).toBe(false);
  });

  it("rejects phone numbers that can't be dialled", async () => {
    for (const phone of ["", "12", "+998 90", "abcdefghij"]) {
      const result = await guardRequestSubmission({ ...valid, phone });
      expect(result.ok, `phone ${phone}`).toBe(false);
    }
  });

  it("silently refuses when the hidden field is filled", async () => {
    const result = await guardRequestSubmission({
      ...valid,
      phone: uniquePhone(),
      trap: "http://spam.example",
    });
    expect(result.ok).toBe(false);
  });

  it("caps an over-long comment", async () => {
    const result = await guardRequestSubmission({
      ...valid,
      phone: uniquePhone(),
      notes: "a".repeat(2001),
    });
    expect(result.ok).toBe(false);
  });

  it("truncates item fields instead of trusting their length", async () => {
    const result = await guardRequestSubmission({
      ...valid,
      phone: uniquePhone(),
      items: [
        {
          productName: "x".repeat(500),
          categorySlug: "c",
          productSlug: "p",
        } as never,
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.items[0].productName.length).toBe(200);
  });

  it("stops a flood from one phone number", async () => {
    const phone = uniquePhone();
    const outcomes = [];
    for (let i = 0; i < 4; i++) {
      // A fresh IP each time so the per-phone limit is what trips.
      currentIp = "ip-" + i + Math.random();
      outcomes.push((await guardRequestSubmission({ ...valid, phone })).ok);
    }
    expect(outcomes).toEqual([true, true, true, false]);
  });

  it("stops a flood from one address", async () => {
    currentIp = "10.0.0.7";
    const outcomes = [];
    for (let i = 0; i < 6; i++) {
      outcomes.push(
        (await guardRequestSubmission({ ...valid, phone: uniquePhone() })).ok
      );
    }
    expect(outcomes.slice(0, 5)).toEqual([true, true, true, true, true]);
    expect(outcomes[5]).toBe(false);
  });
});
