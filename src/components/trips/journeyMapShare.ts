import type { MemberJourneyMapStatsDTO } from '@uaetrail/shared-types';

export const buildJourneyMapShareText = (stats: MemberJourneyMapStatsDTO): string => {
  const lines = [
    'My map 🌍',
    `${stats.visitedCount} places I've been · ${stats.wishlistCount} I want to go`,
  ];
  if (stats.totalPins > 0) {
    lines.push(`${stats.totalPins} pins on my map`);
  }
  lines.push('— tracked on UAE Trail');
  return lines.join('\n');
};

export const shareJourneyMapSummary = async (stats: MemberJourneyMapStatsDTO): Promise<boolean> => {
  const text = buildJourneyMapShareText(stats);
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: 'My map', text });
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return false;
    }
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
};
