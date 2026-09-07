import { RequestStatus, REQUEST_STATUS_LABELS } from "@/lib/types";

const STATUS_STYLES: Record<RequestStatus, string> = {
  new: "bg-navy/10 text-navy",
  contacted: "bg-sage/15 text-sage-dark",
  measured: "bg-sage/15 text-sage-dark",
  in_production: "bg-navy/10 text-navy",
  ready_delivered: "bg-sage/25 text-sage-dark",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {REQUEST_STATUS_LABELS[status]}
    </span>
  );
}
