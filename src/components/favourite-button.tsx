"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFavourite } from "@/lib/favourites-actions";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"}>
      <path
        d="M12 20.5s-7.5-4.6-10-9.2C.6 8 2 4.5 5.4 3.7c2-.5 4 .3 5.2 2 1.2-1.7 3.2-2.5 5.2-2 3.4.8 4.8 4.3 3.4 7.6-2.5 4.6-10 9.2-10 9.2Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FavouriteButton({
  productId,
  productPath,
  initialIsFavourite,
}: {
  productId: string;
  productPath: string;
  initialIsFavourite: boolean;
}) {
  const router = useRouter();
  const [isFavourite, setIsFavourite] = useState(initialIsFavourite);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleFavourite(productId, productPath);
      if ("error" in result) {
        router.push("/account");
        return;
      }
      setIsFavourite(result.isFavourite);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={isFavourite}
      className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition disabled:opacity-60 ${
        isFavourite
          ? "border-sage-dark bg-sage/15 text-sage-dark"
          : "border-navy/15 text-navy hover:bg-navy/5"
      }`}
    >
      <HeartIcon filled={isFavourite} />
      {isFavourite ? "В избранном" : "В избранное"}
    </button>
  );
}
