import { RequestStatus, REQUEST_STATUS_LABELS } from "@/lib/types";

// Each stage of the pipeline gets its own colour, so a list of requests
// reads at a glance: clay needs action, blue is in talks, green is agreed,
// gold is money received, navy is production and shipping.
const STATUS_STYLES: Record<RequestStatus, string> = {
  new_order: "bg-clay-light text-[#9a5733] ring-clay/25",
  contacted: "bg-[#e3eef3] text-info ring-info/20",
  meeting_scheduled: "bg-[#e3eef3] text-info ring-info/20",
  meeting_done: "bg-sage-light text-[#4f6349] ring-sage/25",
  purchase_request: "bg-sage-light text-[#4f6349] ring-sage/25",
  deposit_received: "bg-cream text-accent-dark ring-accent-dark/20",
  paid_full: "bg-cream text-accent-dark ring-accent-dark/25",
  in_production: "bg-navy/10 text-navy ring-navy/15",
  ready_shipment: "bg-navy text-cream ring-navy",
};

/** The status name without its leading emoji (kept for the Telegram bot). */
export function statusText(status: RequestStatus): string {
  return REQUEST_STATUS_LABELS[status].replace(/^\S+\s/, "");
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusText(status)}
    </span>
  );
}
