import { RequestStatus, REQUEST_STATUS_LABELS } from "@/lib/types";

const STATUS_STYLES: Record<RequestStatus, { bg: string; text: string; dot: string }> = {
  new: { bg: "bg-navy/10", text: "text-navy", dot: "bg-navy" },
  contacted: { bg: "bg-navy/10", text: "text-navy", dot: "bg-navy" },
  measured: { bg: "bg-sage/15", text: "text-sage-dark", dot: "bg-sage-dark" },
  in_production: { bg: "bg-sage/15", text: "text-sage-dark", dot: "bg-sage-dark" },
  ready_delivered: { bg: "bg-sage/25", text: "text-sage-dark", dot: "bg-sage-dark" },
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
