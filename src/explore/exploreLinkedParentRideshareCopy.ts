/** User-facing copy when a rideshare activity is linked to a parent outing. */
export type LinkedParentRidesharePeekCopy = {
  eyebrow: string;
  showTitleSubtitle: boolean;
};

export const linkedParentRidesharePeekCopy = (
  parentActivityType: string | null | undefined,
  parentTitle: string
): LinkedParentRidesharePeekCopy => {
  const type = String(parentActivityType ?? '').toLowerCase();
  const title = parentTitle.trim();
  if (type === 'hiking') {
    return { eyebrow: 'Linked to Hiking Trip', showTitleSubtitle: true };
  }
  if (type === 'camping') {
    return { eyebrow: 'Linked to Camping Plan', showTitleSubtitle: true };
  }
  if (title) {
    return { eyebrow: `Linked to ${title}`, showTitleSubtitle: false };
  }
  return { eyebrow: 'Linked to outing', showTitleSubtitle: false };
};
