import {
  resolveActivityDetailTabFooterKind as resolveActivityDetailTabFooterKindWire,
  type ActivityDetailTabFooterKind,
} from '@uaetrail/shared-types';
import type { ActivityDetailTabId } from './activityDetailTab';
import type { JoinRequestUiState } from '../utils/joinRequestUi';

export type { ActivityDetailTabFooterKind };

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

const joinEngagementFromUiState = (joinUiState: JoinRequestUiState) => joinUiState.kind;

/**
 * v3.2 tab-scoped footer intent — canonical policy in `@uaetrail/shared-types`.
 */
export const resolveActivityDetailTabFooterKind = (
  input: ActivityDetailTabFooterInput
): ActivityDetailTabFooterKind =>
  resolveActivityDetailTabFooterKindWire({
    tab: input.tab,
    isHostUser: input.isHostUser,
    isEmbedded: input.isEmbedded,
    previewMode: input.previewMode,
    canAccessCrewSurfaces: input.canAccessCrewSurfaces,
    joinEngagement: joinEngagementFromUiState(input.joinUiState),
    hasMeetingCoordinates: input.hasMeetingCoordinates,
    linkedRideshareId: input.linkedRideshareId,
    rideshareEnabled: input.rideshareEnabled,
    showParticipantFooterShortcuts: input.showParticipantFooterShortcuts,
  });
