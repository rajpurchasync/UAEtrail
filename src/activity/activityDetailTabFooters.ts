import type { ActivityDetailTabId } from './activityDetailTab';
import type { JoinRequestUiState } from '../utils/joinRequestUi';

export type ActivityDetailTabFooterKind =
  | 'plan_join'
  | 'plan_host_share'
  | 'place_directions'
  | 'buddies_invite'
  | 'transport_linked_ride'
  | 'transport_empty';

export type ActivityDetailTabFooterInput = {
  tab: ActivityDetailTabId;
  isHostUser: boolean;
  isEmbedded: boolean;
  previewMode: boolean;
  canAccessCrewSurfaces: boolean;
  joinUiState: JoinRequestUiState;
  hasMeetingCoordinates: boolean;
  linkedRideshareId?: string | null;
  rideshareEnabled: boolean;
  showParticipantFooterShortcuts: boolean;
};

/**
 * v3.2 tab-scoped footer intent — UI still renders shared join chrome on Plan;
 * other tabs add primary actions (directions, invite, view ride).
 */
export const resolveActivityDetailTabFooterKind = (
  input: ActivityDetailTabFooterInput
): ActivityDetailTabFooterKind => {
  if (input.previewMode || input.isEmbedded) {
    return input.tab === 'place' && input.canAccessCrewSurfaces && input.hasMeetingCoordinates
      ? 'place_directions'
      : 'plan_join';
  }

  if (input.isHostUser) {
    if (input.tab === 'buddies' || input.tab === 'plan') return 'plan_host_share';
    if (input.tab === 'transport' && input.linkedRideshareId) return 'transport_linked_ride';
    return 'plan_host_share';
  }

  switch (input.tab) {
    case 'place':
      return input.canAccessCrewSurfaces && input.hasMeetingCoordinates
        ? 'place_directions'
        : 'plan_join';
    case 'buddies':
      return input.showParticipantFooterShortcuts ? 'buddies_invite' : 'plan_join';
    case 'transport':
      if (input.linkedRideshareId || input.rideshareEnabled) return 'transport_linked_ride';
      return 'transport_empty';
    case 'plan':
    default:
      return 'plan_join';
  }
};
