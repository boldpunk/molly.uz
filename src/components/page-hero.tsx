import Image from "next/image";
import Link from "next/link";

// The opening band shared by every inner page: breadcrumb, title and an
// optional photo, on the cream panel the home page uses — so moving between
// pages feels like one site rather than a set of plain documents.
export function PageHero({
  eyebrow,
  title,
  text,
  crumb,
  image,
  imageAlt = "",
  children,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  /** The current page's name in the breadcrumb; defaults to the title. */
  crumb?: string;
  image?: string | null;
  imageAlt?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-cream-light px-6 py-10 sm:px-12 sm:py-14">
        <div aria-hidden className="absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-cream blur-2xl" />
        <div aria-hidden className="absolute -bottom-32 left-1/3 -z-10 h-72 w-72 rounded-full bg-clay-light/60 blur-3xl" />
        <div className={`grid items-center gap-10 ${image ? "lg:grid-cols-[1.1fr_0.9fr]" : ""}`}>
          <div className="max-w-2xl">
            <nav className="flex items-center gap-1.5 text-xs text-navy/50 animate-fade-up">
              <Link href="/" className="transition hover:text-navy">
                Главная
              </Link>
              <span aria-hidden>/</span>
              <span className="text-navy">{crumb ?? title}</span>
            </nav>
            {eyebrow && (
              <span className="eyebrow mt-6 animate-fade-up [animation-delay:60ms]">{eyebrow}</span>
            )}
            <h1
              className={`animate-fade-up font-heading text-3xl font-bold tracking-tight text-navy [animation-delay:120ms] sm:text-5xl ${
                eyebrow ? "mt-3" : "mt-5"
              }`}
            >
              {title}
            </h1>
            {text && (
              <p className="mt-4 max-w-xl animate-fade-up text-base text-navy/65 [animation-delay:200ms] sm:text-lg">
                {text}
              </p>
            )}
            {children && <div className="mt-7 animate-fade-up [animation-delay:280ms]">{children}</div>}
          </div>
          {image && (
            <div className="relative aspect-[4/3] animate-fade-up overflow-hidden rounded-[1.5rem] shadow-xl shadow-navy/10 [animation-delay:200ms]">
              <Image
                src={image}
                alt={imageAlt}
                fill
                priority
                quality={85}
                sizes="(min-width: 1280px) 520px, (min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
