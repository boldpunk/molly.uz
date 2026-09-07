export function PlaceholderImage({
  label,
  className = "",
  aspect = "aspect-[4/3]",
}: {
  label: string;
  className?: string;
  aspect?: string;
}) {
  return (
    <div
      className={`${aspect} ${className} flex items-center justify-center rounded-lg border border-navy/10 bg-gradient-to-br from-navy/5 to-sage/10 text-center`}
      role="img"
      aria-label={`Заглушка изображения: ${label}`}
    >
      <span className="px-4 text-xs font-medium uppercase tracking-wide text-navy/40">
        {label}
        <br />
        фото скоро появится
      </span>
    </div>
  );
}
