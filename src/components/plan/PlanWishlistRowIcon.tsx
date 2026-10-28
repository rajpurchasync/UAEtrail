/** Emoji well for Plan wishlist rows (matches map pin vocabulary). */
export const PlanWishlistRowIcon = ({ emoji }: { emoji: string }) => (
  <span
    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-lg leading-none"
    aria-hidden
  >
    {emoji}
  </span>
);
