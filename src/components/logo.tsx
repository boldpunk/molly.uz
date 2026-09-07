const VARIANTS = {
  horizontal: {
    src: "/logo/molly-home-logo-horizontal-color.svg",
    width: 296,
    height: 84,
  },
  stacked: {
    src: "/logo/molly-home-logo-stacked-color.svg",
    width: 477,
    height: 231,
  },
} as const;

export function Logo({
  variant = "horizontal",
  className = "h-7 w-auto",
}: {
  variant?: keyof typeof VARIANTS;
  className?: string;
}) {
  const { src, width, height } = VARIANTS[variant];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      width={width}
      height={height}
      alt="Molly Home"
      className={className}
    />
  );
}
