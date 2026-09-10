export interface ReviewItem {
  name: string;
  role?: string;
  rating: number;
  text: string;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill={filled ? "currentColor" : "none"} className="h-4 w-4">
      <path
        d="M10 2.5l2.2 4.6 5 .7-3.6 3.6.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.6 5-.7L10 2.5Z"
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ReviewsGrid({ items }: { items: ReviewItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((review, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-xl border border-navy/10 bg-white p-5"
        >
          <div className="flex items-center gap-0.5 text-accent-dark">
            {Array.from({ length: 5 }).map((_, star) => (
              <StarIcon key={star} filled={star < review.rating} />
            ))}
          </div>
          <p className="text-sm leading-relaxed text-navy/70">
            &laquo;{review.text}&raquo;
          </p>
          <div className="mt-auto pt-1">
            <p className="text-sm font-semibold text-navy">{review.name}</p>
            {review.role && (
              <p className="text-xs text-navy/50">{review.role}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
