import type { ActivityMapPeekEssentials } from '../../../../activity/resolveActivityMapPeekEssentials';
import { EXPLORE_PEEK } from '../../../../config/exploreTheme';

/** Price + how to join — one scannable band (not mixed with house rules). */
export const ActivityMapPeekEssentialsRow = ({
  essentials,
}: {
  essentials: ActivityMapPeekEssentials;
}) => {
  if (!essentials.summaryLine) return null;

  return (
    <p className={EXPLORE_PEEK.tripEssentials} data-peek-essentials>
      {essentials.summaryLine}
    </p>
  );
};