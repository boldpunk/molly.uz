import { CornerJointMark } from "@/components/icons/brand-mark";

export function Logo({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ gap: size * 0.28 }}
    >
      <CornerJointMark style={{ width: size, height: size, flexShrink: 0 }} />
      <span className="flex flex-col" style={{ gap: size * 0.02 }}>
        <span
          className="font-heading font-bold leading-none text-navy"
          style={{ fontSize: size * 0.62 }}
        >
          Molly
        </span>
        <span
          className="font-sans font-semibold leading-none text-navy/60"
          style={{ fontSize: Math.max(size * 0.16, 6), letterSpacing: "0.24em" }}
        >
          HOME
        </span>
      </span>
    </span>
  );
}
