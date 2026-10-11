/** Smart date for activity detail hero — weekday + month/day, no year. */
export const formatActivityDetailHeroDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
