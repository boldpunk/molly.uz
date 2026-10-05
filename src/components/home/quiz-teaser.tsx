import Link from "next/link";
import { ROOMS } from "@/lib/quiz";
import { getCategoryIcon } from "@/components/icons/categories";
import { Reveal } from "@/components/reveal";

export function QuizTeaser() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <Reveal className="relative isolate overflow-hidden rounded-[2rem] bg-navy px-6 py-10 text-white sm:px-12 sm:py-12">
        {/* A strip of measuring tape along the top edge */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-3 bg-[#e8c97f]"
          style={{
            backgroundImage: "repeating-linear-gradient(90deg, rgba(24,43,76,.55) 0 1px, transparent 1px 12px)",
            backgroundSize: "100% 60%",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div aria-hidden className="absolute -right-16 -top-20 -z-10 h-72 w-72 rounded-full bg-clay/30 blur-3xl" />
        <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className="eyebrow text-cream">Подбор за минуту</span>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Не знаете, с чего начать?
            </h2>
            <p className="mt-3 max-w-md text-white/65">
              Четыре вопроса — и у вас подборка моделей под ваш интерьер. Начните с комнаты:
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {ROOMS.map((r) => {
              const Icon = getCategoryIcon(r.categories[0]);
              return (
                <Link
                  key={r.id}
                  href={`/podbor?room=${r.id}`}
                  className="group flex items-center gap-3 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10 transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-navy"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 transition group-hover:bg-cream">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{r.label}</span>
                    <span className="block truncate text-xs text-white/50 transition group-hover:text-navy/55">{r.note}</span>
                  </span>
                  <span aria-hidden className="transition group-hover:translate-x-1">→</span>
                </Link>
              );
            })}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
