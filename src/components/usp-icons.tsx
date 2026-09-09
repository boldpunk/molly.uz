type IconProps = { className?: string };

const base = "h-5 w-5";

function RulerIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2.5" y="8" width="19" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 8v3M10 8v2M14 8v3M18 8v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function LayersIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3 12l9 5 9-5M3 16l9 5 9-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DropletIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3c4 5 7 8.5 7 12a7 7 0 1 1-14 0c0-3.5 3-7 7-12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WrenchIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3 18l3 3 6.6-6.3a4 4 0 0 0 5.1-5.4l-2.8 2.8-2.6-.6-.6-2.6 2.8-2.8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PaletteIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.3-.5-.8-.5-1.2 0-1 .8-1.5 1.8-1.5H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="10.5" r="1.1" fill="currentColor" />
      <circle cx="11" cy="7.5" r="1.1" fill="currentColor" />
      <circle cx="15" cy="8" r="1.1" fill="currentColor" />
    </svg>
  );
}

function LeafIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M20 4C11 4 5 10 5 16c0 2 1 3 3 3 6 0 12-6 12-15Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 19c2-4 6-8 10-11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3.5l2.5 5.6 6 .6-4.5 4 1.3 6-5.3-3.1-5.3 3.1 1.3-6-4.5-4 6-.6L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TruckIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M2 7h11v9H2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M13 10h4l3.5 3.5V16H13z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="16.5" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function CheckIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 12.2l2.3 2.3 4.7-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BoxIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3 7.5V16l9 5 9-5V7.5M12 12v9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function CashIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.5 9v.01M18.5 15v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PaymeIcon({ className = base }: IconProps) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/images/payment/payme.png" alt="Payme" className={`${className} object-contain`} />;
}

function ClickIcon({ className = base }: IconProps) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/images/payment/click.png" alt="Click" className={`${className} rounded-[20%] object-contain`} />;
}

function UzcardIcon({ className = base }: IconProps) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/images/payment/uzcard.png" alt="Uzcard" className={`${className} object-contain`} />;
}

function HumoIcon({ className = base }: IconProps) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/images/payment/humo.png" alt="Humo" className={`${className} rounded-[20%] object-contain`} />;
}

export const USP_ICONS: Record<string, (props: IconProps) => React.JSX.Element> = {
  ruler: RulerIcon,
  layers: LayersIcon,
  droplet: DropletIcon,
  wrench: WrenchIcon,
  shield: ShieldIcon,
  palette: PaletteIcon,
  leaf: LeafIcon,
  star: StarIcon,
  clock: ClockIcon,
  truck: TruckIcon,
  check: CheckIcon,
  box: BoxIcon,
  cash: CashIcon,
  payme: PaymeIcon,
  click: ClickIcon,
  uzcard: UzcardIcon,
  humo: HumoIcon,
};

export const USP_ICON_OPTIONS: { key: string; label: string }[] = [
  { key: "ruler", label: "Линейка — размеры" },
  { key: "layers", label: "Слои — материал" },
  { key: "droplet", label: "Капля — влагостойкость" },
  { key: "wrench", label: "Ключ — фурнитура" },
  { key: "shield", label: "Щит — гарантия" },
  { key: "palette", label: "Палитра — цвет/отделка" },
  { key: "leaf", label: "Лист — экологичность" },
  { key: "star", label: "Звезда — качество" },
  { key: "clock", label: "Часы — сроки" },
  { key: "truck", label: "Грузовик — доставка" },
  { key: "check", label: "Галочка — сертификат" },
  { key: "box", label: "Коробка — под проект" },
  { key: "cash", label: "Наличные" },
  { key: "payme", label: "Payme (логотип)" },
  { key: "click", label: "Click (логотип)" },
  { key: "uzcard", label: "Uzcard (логотип)" },
  { key: "humo", label: "Humo (логотип)" },
];

export const BRAND_LOGO_ICONS = new Set(["payme", "click", "uzcard", "humo"]);

export function isBrandLogoIcon(icon?: string): boolean {
  return Boolean(icon && BRAND_LOGO_ICONS.has(icon));
}

export function UspIcon({ icon, className }: { icon?: string; className?: string }) {
  const Icon = (icon && USP_ICONS[icon]) || CheckIcon;
  return <Icon className={className} />;
}
