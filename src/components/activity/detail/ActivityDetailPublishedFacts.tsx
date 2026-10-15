import type { ExploreCardModel } from '../../../explore/exploreCardModel';
import { ActivityDiscoveryPublishedBody } from '../../../discovery/ActivityDiscoveryPublishedBody';
import { ActivityDetailHeroStatusStrip } from './ActivityDetailHeroStatusStrip';
import type { ActivityDetailHeroStatusChip } from '../../../activity/activityDetailHeroStatus';

type ActivityDetailPublishedFactsProps = {
  card: ExploreCardModel;
  /** Viewer join/host state — not stored on the activity row. */
  statusChips: ActivityDetailHeroStatusChip[];
};

/** Published activity fields from L1 discovery card (same module as map peek). */
export const ActivityDetailPublishedFacts = ({
  card,
  statusChips,
}: ActivityDetailPublishedFactsProps) => (
  <div className="space-y-2">
    <ActivityDetailHeroStatusStrip chips={statusChips} />
    <ActivityDiscoveryPublishedBody card={card} showDirections={false} />
  </div>
);
