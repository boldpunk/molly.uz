import type { ProposalUnit } from "./proposal-money";

export type ProposalLanguage = "ru" | "uz";

export const PROPOSAL_LANGUAGES: ProposalLanguage[] = ["ru", "uz"];

export const PROPOSAL_LANGUAGE_LABELS: Record<ProposalLanguage, string> = {
  ru: "Русский",
  uz: "O'zbekcha",
};

// Every piece of boilerplate the generated document can print. Brand names,
// model names and anything the manager typed stay as entered — only these
// labels switch with the document language.
interface ProposalDictionary {
  documentTitle: string;
  client: string;
  preparedBy: string;
  partners: string;
  columnImage: string;
  columnProduct: string;
  columnQuantity: string;
  columnPrice: string;
  columnTotal: string;
  dimensions: string;
  deadline: string;
  itemsTotal: string;
  grandTotal: string;
  page: string;
  signatureClosing: string;
  signatureStaff: string;
  signatureClient: string;
  phone: string;
  units: Record<ProposalUnit, string>;
}

const DICTIONARIES: Record<ProposalLanguage, ProposalDictionary> = {
  ru: {
    documentTitle: "КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ",
    client: "ЗАКАЗЧИК",
    preparedBy: "КП ПОДГОТОВИЛ",
    partners: "ПАРТНЁРЫ ПРОЕКТА",
    columnImage: "Фото",
    columnProduct: "Наименование / описание",
    columnQuantity: "Кол-во",
    columnPrice: "Цена",
    columnTotal: "Сумма",
    dimensions: "Размеры",
    deadline: "СРОК ИЗГОТОВЛЕНИЯ",
    itemsTotal: "Изделия",
    grandTotal: "ОБЩАЯ СУММА",
    page: "Страница",
    signatureClosing: "С уважением,",
    signatureStaff: "Ответственный сотрудник",
    signatureClient: "Клиент",
    phone: "Тел.",
    units: {
      pcs: "шт.",
      rm: "п.м.",
      m2: "м²",
      m: "м",
      set: "комплект",
      service: "услуга",
    },
  },
  uz: {
    documentTitle: "TIJORAT TAKLIFI",
    client: "BUYURTMACHI",
    preparedBy: "TAKLIF TAYYORLADI",
    partners: "LOYIHADAGI HAMKORLARIMIZ",
    columnImage: "Surat",
    columnProduct: "Mahsulot nomi / tavsif",
    columnQuantity: "Soni",
    columnPrice: "Narxi",
    columnTotal: "Umumiy",
    dimensions: "O'lchamlari",
    deadline: "TOPSHIRISH MUDDATI",
    itemsTotal: "Mahsulotlar",
    grandTotal: "UMUMIY QIYMAT",
    page: "Sahifa",
    signatureClosing: "Hurmat bilan,",
    signatureStaff: "Mas'ul xodim",
    signatureClient: "Mijoz",
    phone: "Tel.",
    units: {
      pcs: "dona",
      rm: "p.m.",
      m2: "m²",
      m: "m",
      set: "komplekt",
      service: "xizmat",
    },
  },
};

export function proposalStrings(language: ProposalLanguage): ProposalDictionary {
  return DICTIONARIES[language] ?? DICTIONARIES.ru;
}

export function unitLabel(
  unit: ProposalUnit,
  language: ProposalLanguage
): string {
  return proposalStrings(language).units[unit] ?? unit;
}

// Admin-side unit labels stay in Russian (the panel itself is Russian-only);
// only the generated document follows the proposal language.
export const UNIT_ADMIN_LABELS: Record<ProposalUnit, string> = {
  pcs: "шт.",
  rm: "п.м.",
  m2: "м²",
  m: "м",
  set: "комплект",
  service: "услуга",
};

export function formatProposalDate(value: string): string {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}.${month}.${year}`;
}
