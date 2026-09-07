export function CornerJointMark({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 46 46" fill="none" className={className} style={style}>
      <path
        d="M10 30 V13 H27"
        stroke="#182b4c"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M36 16 V33 H19"
        stroke="#7c9a68"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
