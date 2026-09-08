import { RequestForm } from "@/components/admin/request-form";
import { createManualOrder } from "@/lib/admin-actions";
import { PageHeader } from "@/components/admin/page-header";
import { getAllProducts } from "@/lib/data";

export default async function NewRequestPage() {
  const products = await getAllProducts();

  return (
    <div>
      <PageHeader
        title="Новый заказ"
        description="Заказ будет опубликован в Telegram-группе менеджеров, как и заявки с сайта"
        back={{ href: "/admin/requests", label: "Заявки" }}
      />
      <div className="mt-6">
        <RequestForm
          action={createManualOrder}
          products={products.map((p) => ({
            id: p.id,
            name: p.name,
            categorySlug: p.categorySlug,
          }))}
        />
      </div>
    </div>
  );
}
