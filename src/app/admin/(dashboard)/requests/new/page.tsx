import { RequestForm } from "@/components/admin/request-form";
import { createManualOrder } from "@/lib/admin-actions";
import { PageHeader } from "@/components/admin/page-header";

export default function NewRequestPage() {
  return (
    <div>
      <PageHeader
        title="Новый заказ"
        description="Заказ будет опубликован в Telegram-группе менеджеров, как и заявки с сайта"
        back={{ href: "/admin/requests", label: "Заявки" }}
      />
      <div className="mt-6">
        <RequestForm action={createManualOrder} />
      </div>
    </div>
  );
}
