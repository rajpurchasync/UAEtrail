import type { PublishingProfileKind } from '@uaetrail/shared-types';
import {
  OPERATOR_ACTIVITIES_PATH,
  OPERATOR_HISTORY_PATH,
  OPERATOR_OVERVIEW_PATH,
  OPERATOR_PLACES_PATH,
  OPERATOR_PROFILE_PATH,
  OPERATOR_REQUESTS_PATH,
  OPERATOR_TEAM_PATH,
} from '../../config/surfacePaths';
import {
  publishingProfileKindToDeskBrand,
  type WorkspaceBrandKind,
} from '../../content/workspaceVocabulary';

export type OperatorDeskModuleId =
  | 'overview'
  | 'requests'
  | 'activities'
  | 'profile'
  | 'team'
  | 'places'
  | 'history';

const DESK_MODULE_LABEL: Record<OperatorDeskModuleId, string> = {
  overview: 'Overview',
  requests: 'Join requests',
  activities: 'Activities',
  profile: 'Public profile',
  team: 'Team',
  places: 'Places',
  history: 'History',
};

const DESK_MODULE_PATH: Record<OperatorDeskModuleId, string> = {
  overview: OPERATOR_OVERVIEW_PATH,
  requests: OPERATOR_REQUESTS_PATH,
  activities: OPERATOR_ACTIVITIES_PATH,
  profile: OPERATOR_PROFILE_PATH,
  team: OPERATOR_TEAM_PATH,
  places: OPERATOR_PLACES_PATH,
  history: OPERATOR_HISTORY_PATH,
};

/** Desk nav chips for the active operator kind — shared shell, kind-specific modules. */
export const operatorDeskModulesForKind = (
  kind: PublishingProfileKind
): OperatorDeskModuleId[] => {
  switch (kind) {
    case 'community':
      return ['overview', 'requests', 'activities', 'history'];
    case 'pro_guide':
      return ['overview', 'requests', 'activities', 'profile', 'history'];
    case 'shop':
    case 'ecommerce':
      return ['overview', 'requests', 'activities', 'profile', 'team', 'places', 'history'];
    case 'agency':
    case 'hospitality':
    case 'partner':
      return ['overview', 'requests', 'activities', 'profile', 'team', 'places', 'history'];
    default:
      return ['overview', 'requests', 'activities', 'history'];
  }
};

export type OperatorDeskNavLink = { to: string; label: string; module: OperatorDeskModuleId };

export const operatorDeskNavLinksForKind = (kind: PublishingProfileKind): OperatorDeskNavLink[] =>
  operatorDeskModulesForKind(kind).map((module) => ({
    module,
    to: DESK_MODULE_PATH[module],
    label: DESK_MODULE_LABEL[module],
  }));

export const resolveOperatorDeskBrand = (
  kind: PublishingProfileKind | null | undefined
): WorkspaceBrandKind =>
  publishingProfileKindToDeskBrand(kind ?? 'community');