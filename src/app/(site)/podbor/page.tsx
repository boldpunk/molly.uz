import type { Metadata } from "next";
import { getAllProducts } from "@/lib/data";
import { ROOMS, type Room } from "@/lib/quiz";
import { PageHero } from "@/components/page-hero";
import { FurnitureQuiz } from "@/components/quiz/furniture-quiz";

export const metadata: Metadata = {
  title: "Подбор мебели за минуту — Molly Home",
  description:
    "Ответьте на четыре вопроса — комната, настроение, размер и сроки — и получите подборку моделей Molly Home с расчётом стоимости.",
};

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const [{ room }, products] = await Promise.all([searchParams, getAllProducts()]);
  const initialRoom = ROOMS.some((r) => r.id === room) ? (room as Room) : undefined;

  return (
    <div>
      <PageHero
        eyebrow="Подбор за минуту"
        title="Найдём мебель под ваш дом"
        text="Четыре коротких вопроса — и подборка моделей готова. Без регистрации, расчёт стоимости пришлём по телефону."
        crumb="Подбор"
      />
      <div className="mt-10">
        <FurnitureQuiz products={products} initialRoom={initialRoom} />
      </div>
    </div>
  );
}
