import Link from "next/link";
import { PlusIcon, ArrowRightIcon } from "./icons";

export function PageHeader({
  title,
  description,
  action,
  back,
  children,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
  back?: { href: string; label: string };
  /** Extra controls shown beside the main action. */
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && (
          <Link
            href={back.href}
            className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-navy/60 ring-1 ring-navy/10 transition hover:text-navy hover:ring-navy/25"
          >
            <ArrowRightIcon className="h-3.5 w-3.5 rotate-180" />
            {back.label}
          </Link>
        )}
        <h1 className="font-heading text-2xl font-bold tracking-tight text-navy sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-navy/55">{description}</p>}
      </div>
      {(action || children) && (
        <div className="flex flex-wrap items-center gap-2">
          {children}
          {action && (
            <Link
              href={action.href}
              className="inline-flex items-center gap-1.5 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-navy/15 transition hover:-translate-y-0.5 hover:bg-navy-light"
            >
              <PlusIcon />
              {action.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
