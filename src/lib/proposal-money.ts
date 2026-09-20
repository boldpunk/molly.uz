export type ProposalCurrency = "UZS" | "USD" | "EUR";
export type ProposalUnit = "pcs" | "rm" | "m2" | "m" | "set" | "service";

export const PROPOSAL_CURRENCIES: ProposalCurrency[] = ["UZS", "USD", "EUR"];
export const PROPOSAL_UNITS: ProposalUnit[] = [
  "pcs",
  "rm",
  "m2",
  "m",
  "set",
  "service",
];

const QUANTITY_SCALE = 1000;
const MINOR_SCALE = 100;

// UZS is quoted in whole so'm — showing "3 600 000,00" would just be noise.
const CURRENCY_DECIMALS: Record<ProposalCurrency, number> = {
  UZS: 0,
  USD: 2,
  EUR: 2,
};

const CURRENCY_SYMBOLS: Record<ProposalCurrency, { ru: string; uz: string }> = {
  UZS: { ru: "сум", uz: "so'm" },
  USD: { ru: "$", uz: "$" },
  EUR: { ru: "€", uz: "€" },
};

// Accepts what a manager actually types: "3 600 000", "1 250,50", "1250.5",
// non-breaking spaces pasted from Excel. Returns null when there's no number
// in there at all so callers can tell "empty" from "zero".
function parseDecimal(input: string, scale: number): number | null {
  const cleaned = input
    .replace(/[\s  ']/g, "")
    .replace(",", ".")
    .replace(/[^\d.\-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;

  const negative = cleaned.startsWith("-");
  const [wholePart = "", fracPart = ""] = cleaned.replace("-", "").split(".");
  if (!wholePart && !fracPart) return null;

  const digits = String(scale).length - 1;
  const frac = (fracPart + "0".repeat(digits)).slice(0, digits);
  const value = Number(wholePart || "0") * scale + Number(frac || "0");
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

export function parseMoneyToMinor(input: string): number | null {
  return parseDecimal(input, MINOR_SCALE);
}

export function parseQuantityToMilli(input: string): number | null {
  return parseDecimal(input, QUANTITY_SCALE);
}

// quantityMilli * unitPriceMinor overflows Number.MAX_SAFE_INTEGER for large
// so'm figures, so the multiply happens in BigInt and only the rounded result
// comes back as a number.
export function lineTotalMinor(
  quantityMilli: number,
  unitPriceMinor: number
): number {
  const product =
    BigInt(Math.round(quantityMilli)) * BigInt(Math.round(unitPriceMinor));
  const scale = BigInt(QUANTITY_SCALE);
  const rounded = (product + scale / BigInt(2)) / scale;
  return Number(rounded);
}

export function formatQuantity(quantityMilli: number): string {
  const value = quantityMilli / QUANTITY_SCALE;
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 3,
  }).format(value);
}

export function formatMoney(
  minor: number,
  currency: ProposalCurrency,
  options: { withSymbol?: boolean; language?: "ru" | "uz" } = {}
): string {
  const { withSymbol = true, language = "ru" } = options;
  const decimals = CURRENCY_DECIMALS[currency];
  const value = minor / MINOR_SCALE;
  const formatted = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
    .format(value)
    // ru-RU groups with a narrow no-break space; a plain space matches the
    // reference document and survives copy-paste out of the PDF.
    .replace(/ | /g, " ");
  if (!withSymbol) return formatted;
  return `${formatted} ${CURRENCY_SYMBOLS[currency][language]}`;
}

export function currencySymbol(
  currency: ProposalCurrency,
  language: "ru" | "uz" = "ru"
): string {
  return CURRENCY_SYMBOLS[currency][language];
}

// Round-trips a stored value back into the text input that produced it.
export function minorToInput(minor: number, currency: ProposalCurrency): string {
  const decimals = CURRENCY_DECIMALS[currency];
  return (minor / MINOR_SCALE).toFixed(decimals);
}

export function milliToInput(quantityMilli: number): string {
  return String(quantityMilli / QUANTITY_SCALE);
}
