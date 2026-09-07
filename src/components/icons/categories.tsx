type IconProps = { className?: string };

const base = "h-6 w-6";

export function KitchenIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 9h18M3 9v10a1 1 0 0 0 1 1h1M3 9V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3M21 9v10a1 1 0 0 1-1 1h-1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 20v-9M16 20v-9M8 14h8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SofaIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M5 12V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 12a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M4 16v2.5M20 16v2.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BedroomSetIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M4 11h16M8 8h2M8 14h2M14 8h2M14 14h2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function WardrobeIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path d="M12 3v18" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M9 11v.01M15 11v.01"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BedIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 19v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 15h18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path
        d="M6 15v-3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M3 19v2M21 19v2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FurnitureIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 20v-5a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 12V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path d="M6 17h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

const CATEGORY_ICONS: Record<string, (props: IconProps) => React.JSX.Element> = {
  "kuhonnaya-mebel": KitchenIcon,
  "myagkaya-mebel": SofaIcon,
  "spalnye-garnitury": BedroomSetIcon,
  garderoby: WardrobeIcon,
  krovati: BedIcon,
};

export function getCategoryIcon(slug: string) {
  return CATEGORY_ICONS[slug] ?? FurnitureIcon;
}
