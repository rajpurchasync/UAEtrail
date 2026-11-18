import type { DiscoveryCardModel } from '../discovery/discoveryCardModel';
import type { JoinRequestUiState } from '../utils/joinRequestUi';
import { resolveActivityMapPeekScheduleLine } from './resolveActivityMapPeekScheduleLine';
import { resolveActivityMapPeekStatChips } from './resolveActivityMapPeekStatChips';
import { resolveActivityMapPeekTitle } from './resolveActivityMapPeekTitle';
import { resolveActivityPeekParticipationWidget } from './resolveActivityPeekParticipationWidget';
import { resolveActivityMapPeekKindLabel } from './resolveActivityMapPeekKindLabel';
import { resolveActivityMapPeekSituationalModules } from './resolveActivityMapPeekSituationalModules';
import { resolveActivityMapPeekLocationLine } from './resolveActivityMapPeekLocationLine';
import { resolveActivityMapPeekEssentials } from './resolveActivityMapPeekEssentials';
import { resolveActivityMapPeekPolicyLabels } from './resolveActivityMapPeekPolicyLabels';
import { resolveActivityMapPeekCapacityLine } from './resolveActivityMapPeekCapacityLine';

/** Map activity peek presentation — compose resolvers; no join rules in UI. */
export const resolveActivityMapPeekViewModel = (
  card: DiscoveryCardModel,
  joinUiState?: JoinRequestUiState,
  isHostUser?: boolean
) => ({
  title: resolveActivityMapPeekTitle(card),
  scheduleLine: resolveActivityMapPeekScheduleLine(card),
  locationLine: resolveActivityMapPeekLocationLine(card),
  kindLabel: resolveActivityMapPeekKindLabel(card),
  participation: resolveActivityPeekParticipationWidget(card, joinUiState, isHostUser),
  essentials: resolveActivityMapPeekEssentials(card),
  policyLabels: resolveActivityMapPeekPolicyLabels(card),
  capacityLine: resolveActivityMapPeekCapacityLine(card),
  kindChips: resolveActivityMapPeekStatChips(card),
  situationalModules: resolveActivityMapPeekSituationalModules(card, joinUiState),
});