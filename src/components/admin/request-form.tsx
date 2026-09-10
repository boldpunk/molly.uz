"use client";

import { PhoneInput } from "@/components/phone-input";
import { ProductPicker, PickableProduct } from "./product-picker";

export function RequestForm({
  action,
  products,
}: {
  action: (formData: FormData) => void;
  products: PickableProduct[];
}) {
  return (
    <form
      action={action}
      className="max-w-2xl rounded-xl border border-navy/10 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-navy">Имя клиента</span>
          <input
            required
            name="customerName"
            className="input"
            placeholder="Иван Иванов"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-navy">Телефон</span>
          <PhoneInput required name="customerPhone" />
        </label>

        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-navy">Источник</span>
          <input
            name="source"
            defaultValue="Ручной ввод"
            className="input"
            placeholder="Instagram, звонок, визит и т.д."
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-navy">Заметки</span>
          <textarea name="notes" rows={3} className="input" />
        </label>

        <div className="sm:col-span-2">
          <ProductPicker name="productIdsJson" products={products} />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 border-t border-navy/10 pt-5">
        <button
          type="submit"
          className="rounded-full bg-navy px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-navy/90 hover:shadow"
        >
          Создать заказ
        </button>
      </div>
    </form>
  );
}
