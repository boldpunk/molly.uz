"use client";

export function RestoreRevisionButton({ action }: { action: () => void }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Вернуть страницу к этой версии? Текущая версия тоже сохранится в истории.")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-navy ring-1 ring-navy/15 transition hover:bg-navy hover:text-white hover:ring-navy"
      >
        Восстановить
      </button>
    </form>
  );
}
