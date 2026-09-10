export function formatSum(amount: number) {
  return new Intl.NumberFormat("ru-RU").format(amount) + " сум";
}
