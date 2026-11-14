import type { ActivityMapPeekAction } from './activity-map-peek-actions.js';

export type ActivityPeekTwoSlot = {
  primary: ActivityMapPeekAction | null;
  secondary: ActivityMapPeekAction | null;
};

/**
 * Map/list peek shows exactly two wire action buttons (+ Details text).
 * When L1 emits multiple `secondary` rows (host with joiners), pick Share for slot 2 —
 * Manage stays on detail sticky / manage sheet.
 */
export const pickActivityPeekTwoSlotActions = (
  actions: readonly ActivityMapPeekAction[]
): ActivityPeekTwoSlot => {
  const primary = actions.find((action) => action.prominence === 'primary') ?? null;
  const secondaries = actions.filter((action) => action.prominence === 'secondary');

  if (!primary || secondaries.length === 0) {
    return { primary, secondary: secondaries[0] ?? null };
  }

  if (secondaries.length === 1) {
    return { primary, secondary: secondaries[0]! };
  }

  if (primary.id === 'open_crew_chat') {
    const share = secondaries.find((action) => action.id === 'share_activity');
    if (share) return { primary, secondary: share };
  }

  if (primary.id === 'share_activity') {
    const manage = secondaries.find((action) => action.id === 'manage_activity');
    if (manage) return { primary, secondary: manage };
  }

  return { primary, secondary: secondaries[0]! };
};