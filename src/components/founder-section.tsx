import Image from "next/image";
import type { PageBlock } from "@/db/schema";

type Founder = Extract<PageBlock, { type: "founder" }>;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/** The person behind the brand — a portrait beside their story. */
export function FounderSection({ founder }: { founder: Founder }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="relative isolate grid overflow-hidden rounded-[2rem] bg-navy text-white lg:grid-cols-[0.85fr_1.15fr]">
        <div aria-hidden className="absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-clay/25 blur-3xl" />

        <div className="relative aspect-[4/5] lg:aspect-auto lg:min-h-[520px]">
          {founder.photoUrl ? (
            <Image
              src={founder.photoUrl}
              alt={founder.name}
              fill
              quality={85}
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          ) : (
            // Until a portrait is uploaded: the initials on the brand's cream.
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cream to-clay-light">
              <span className="font-heading text-[7rem] font-bold leading-none tracking-tight text-navy/15 sm:text-[9rem]">
                {initials(founder.name)}
              </span>
            </div>
          )}
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-navy/60 to-transparent lg:hidden" />
        </div>

        <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
          <span className="eyebrow text-cream">{founder.role || "Основатель"}</span>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-5xl">{founder.name}</h2>
          <div className="mt-6 h-px w-16 bg-clay" />
          <p className="mt-6 max-w-xl whitespace-pre-line text-base leading-relaxed text-white/75 sm:text-lg">
            {founder.text}
          </p>
        </div>
      </div>
    </section>
  );
}
