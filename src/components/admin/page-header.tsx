import Link from "next/link";
import { PlusIcon, ArrowRightIcon } from "./icons";

export function PageHeader({
  title,
  description,
  action,
  back,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
  back?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {back && (
          <Link
            href={back.href}
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-navy/50 hover:text-navy"
          >
            <ArrowRightIcon className="h-3.5 w-3.5 rotate-180" />
            {back.label}
          </Link>
        )}
        <h1 className="font-heading text-2xl font-bold text-navy">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-navy/50">{description}</p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-navy/90 hover:shadow"
        >
          <PlusIcon />
          {action.label}
        </Link>
      )}
    </div>
  );
}
