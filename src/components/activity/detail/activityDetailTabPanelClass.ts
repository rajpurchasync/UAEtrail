import type { ActivityDetailTabId } from '../../../activity/activityDetailTab';

/** Mobile tab visibility — active tab `block`, others `hidden` (desktop shows all via `md:contents`). */
export const activityDetailTabPanelClass = (
  tab: ActivityDetailTabId,
  active: ActivityDetailTabId
): string => (active === tab ? 'block md:contents' : 'hidden md:contents');
