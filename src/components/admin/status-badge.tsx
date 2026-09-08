import { RequestStatus, REQUEST_STATUS_LABELS } from "@/lib/types";

const STATUS_STYLES: Record<RequestStatus, { bg: string; text: string; dot: string }> = {
  new_order: { bg: "bg-navy/10", text: "text-navy", dot: "bg-navy" },
  contacted: { bg: "bg-navy/10", text: "text-navy", dot: "bg-navy" },
  meeting_scheduled: { bg: "bg-navy/10", text: "text-navy", dot: "bg-navy" },
  meeting_done: { bg: "bg-accent/15", text: "text-accent-dark", dot: "bg-accent-dark" },
  purchase_request: { bg: "bg-accent/15", text: "text-accent-dark", dot: "bg-accent-dark" },
  deposit_received: { bg: "bg-accent/20", text: "text-accent-dark", dot: "bg-accent-dark" },
  paid_full: { bg: "bg-accent/25", text: "text-accent-dark", dot: "bg-accent-dark" },
  in_production: { bg: "bg-accent/25", text: "text-accent-dark", dot: "bg-accent-dark" },
  ready_shipment: { bg: "bg-navy/90", text: "text-white", dot: "bg-white" },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {REQUEST_STATUS_LABELS[status]}
    </span>
  );
}
