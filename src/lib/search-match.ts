// Every word the visitor typed has to appear somewhere in the fields, in any
// order and case; "ё" and "е" count as the same letter.
function normalize(s: string): string {
  return s.toLowerCase().replace(/ё/g, "е");
}

export function matchesQuery(query: string, fields: (string | undefined | null)[]): boolean {
  const haystack = normalize(fields.filter(Boolean).join(" "));
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return words.length > 0 && words.every((w) => haystack.includes(w));
}
