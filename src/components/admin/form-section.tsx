export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-navy/[0.07] bg-white p-6">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-navy">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-navy/50">{description}</p>
        )}
      </div>
      <div className="flex flex-col gap-5">{children}</div>
    </div>
  );
}
