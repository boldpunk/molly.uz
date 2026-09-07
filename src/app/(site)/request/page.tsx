import { getCurrentCustomer } from "@/lib/customers";
import { RequestForm } from "@/components/request-form";

export const dynamic = "force-dynamic";

export default async function RequestPage() {
  const customer = await getCurrentCustomer();

  return (
    <RequestForm
      initialName={customer?.name}
      initialPhone={customer?.phone}
      customerId={customer?.id}
    />
  );
}
