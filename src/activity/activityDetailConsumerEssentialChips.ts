import type { ExploreCardModel } from '../explore/exploreCardModel';
import type { ExploreCardDetailIcon } from '../explore/exploreCopy';

const SKIP_ICONS: ExploreCardDetailIcon[] = ['location', 'time'];

/** Compact fact chips for consumer detail — excludes when/where (shown in lead). */
export const resolveActivityDetailConsumerEssentialChips = (
  card: ExploreCardModel | null | undefined
): string[] => {
  if (!card || card.source !== 'activity') return [];
  const details = card.sections.details ?? [];
  const chips = details
    .filter((row) => !SKIP_ICONS.includes(row.icon))
    .map((row) => row.label?.trim())
    .filter((text): text is string => Boolean(text));

  return [...new Set(chips)];
};
