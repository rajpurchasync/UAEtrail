import type { LucideIcon } from 'lucide-react';
import { EXPLORE_PEEK_CTA } from '../../../../config/exploreTheme';

/** Small icon above peek footer tile labels — explore brand stroke on white tile. */
export const ActivityPeekFooterIcon = ({ icon: Icon }: { icon: LucideIcon }) => (
  <Icon className={EXPLORE_PEEK_CTA.peekTileIcon} strokeWidth={2} aria-hidden />
);
