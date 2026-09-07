"use client";

import { TrashIcon } from "./icons";

export function DeleteButton({
  action,
  label,
}: {
  action: (formData: FormData) => void;
  label: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`${label}? Это действие нельзя отменить.`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
      >
        <TrashIcon className="h-3.5 w-3.5" />
        {label}
      </button>
    </form>
  );
}
