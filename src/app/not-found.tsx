import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Страница не найдена — Molly Home",
  robots: { index: false, follow: false },
};

const FURNITURE_FACTS = [
  "Венский стул № 14 Михаэля Тонета появился в 1859 году и стал одним из первых образцов мебели массового промышленного производства.",
  "Слово «мебель» пришло в русский язык из французского meuble — «подвижный», в отличие от immeuble — «недвижимость».",
  "Самая старая сохранившаяся деревянная мебель в мире — кресло из гробницы Хетепхерес в Египте, ему больше 4500 лет.",
  "МДФ расшифровывается как Medium Density Fibreboard — «древесноволокнистая плита средней плотности».",
  "Слово «диван» восходит к персидскому dēvān — так называли зал совета, где сидели на длинных скамьях вдоль стен.",
  "Слово «гардероб» происходит от французского garder — «хранить» и robe — «одежда».",
  "До XVII века мягкой обивки у кресел почти не было — сидели в основном на деревянных лавках и табуретах.",
  "Пружинный матрас запатентовали в середине XIX века — раньше матрасы набивали соломой, шерстью или перьями.",
  "Кухонный остров как элемент планировки стал массово популярен только в середине XX века, вместе с открытыми кухнями-гостиными.",
  "В традиционном японском доме вместо кровати использовали футон — тонкий матрас, который днём убирали в шкаф, экономя место.",
  "Дуб веками ценится в мебельном деле за твёрдость — некоторые дубовые изделия служат больше 300 лет.",
  "IKEA изобрела плоскую упаковку мебели — идея пришла, когда сотрудник компании отпилил ножки у стола, чтобы он поместился в багажник.",
];

function pickRandomFact(): string {
  return FURNITURE_FACTS[Math.floor(Math.random() * FURNITURE_FACTS.length)];
}

function ChairIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <path
        d="M18 8v24M46 8v40M18 32h28M14 56l4-24M50 56l-4-16"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 6h10M42 6h10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function NotFound() {
  const fact = pickRandomFact();

  return (
    <div className="flex min-h-[calc(100vh-1px)] flex-col">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <Link href="/" aria-label="Molly Home" className="mb-10">
          <Logo size={30} />
        </Link>

        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/25 text-accent-dark">
          <ChairIcon className="h-8 w-8" />
        </span>

        <p className="mt-6 font-heading text-6xl font-bold text-navy/15">404</p>
        <h1 className="mt-2 font-heading text-2xl font-bold text-navy sm:text-3xl">
          Такой страницы не существует
        </h1>
        <p className="mt-3 max-w-md text-sm text-navy/60">
          Похоже, ссылка устарела или в адресе опечатка. Такой мебели у нас
          тоже пока нет — но вот что есть:
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-navy/90"
          >
            На главную
          </Link>
          <Link
            href="/catalog"
            className="rounded-full border border-navy/20 px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy/5"
          >
            Смотреть каталог
          </Link>
          <Link
            href="/contacts"
            className="rounded-full border border-navy/20 px-6 py-3 text-sm font-semibold text-navy transition hover:bg-navy/5"
          >
            Контакты
          </Link>
        </div>

        <div className="mt-12 max-w-lg rounded-xl border border-navy/10 bg-accent/[0.12] p-5 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-dark">
            Пока вы здесь — факт о мебели
          </p>
          <p className="mt-2 text-sm leading-relaxed text-navy/70">{fact}</p>
        </div>
      </div>
    </div>
  );
}
