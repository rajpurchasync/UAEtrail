import type { PublishingProfileKind } from '@uaetrail/shared-types';
import {
  MESSAGES_PATH,
  OPERATOR_ACTIVITIES_PATH,
  OPERATOR_HISTORY_PATH,
  OPERATOR_OVERVIEW_PATH,
  OPERATOR_PLACES_PATH,
  OPERATOR_PROFILE_PATH,
  OPERATOR_REQUESTS_PATH,
  OPERATOR_TEAM_PATH,
} from '../../config/surfacePaths';
import { MEMBER_SCHEDULE_CALENDAR_PATH } from '../../plan/planRouting';
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

/** Consumer projections that share the publishing spine (not separate desk modules). */
export type OperatorDeskProjectionLinkId = 'calendar' | 'messages';

export type OperatorDeskQuickLinkId = OperatorDeskModuleId | OperatorDeskProjectionLinkId;

export type OperatorDeskQuickLink = {
  id: OperatorDeskQuickLinkId;
  to: string;
  label: string;
};

const DESK_QUICK_LINK_META: Record<OperatorDeskQuickLinkId, { to: string; label: string }> = {
  overview: { to: OPERATOR_OVERVIEW_PATH, label: 'Overview' },
  requests: { to: OPERATOR_REQUESTS_PATH, label: 'Approvals' },
  activities: { to: OPERATOR_ACTIVITIES_PATH, label: 'Manage trips' },
  profile: { to: OPERATOR_PROFILE_PATH, label: 'Public profile' },
  team: { to: OPERATOR_TEAM_PATH, label: 'Manage team' },
  places: { to: OPERATOR_PLACES_PATH, label: 'Submit a place' },
  history: { to: OPERATOR_HISTORY_PATH, label: 'Past trips' },
  calendar: { to: MEMBER_SCHEDULE_CALENDAR_PATH, label: 'My calendar' },
  messages: { to: MESSAGES_PATH, label: 'Chat groups' },
};

const DESK_QUICK_LINK_ORDER: OperatorDeskQuickLinkId[] = [
  'calendar',
  'messages',
  'requests',
  'activities',
  'history',
  'profile',
  'places',
  'team',
];

/**
 * Quick links for overview / profile projections — filtered by {@link operatorDeskModulesForKind}.
 * Calendar + chat are member-surface entry points into the same supply data, not parallel consoles.
 */
export const operatorDeskQuickLinksForKind = (kind: PublishingProfileKind): OperatorDeskQuickLink[] => {
  const moduleAllow = new Set(operatorDeskModulesForKind(kind));
  const allowed = new Set<OperatorDeskQuickLinkId>(['calendar', 'messages']);
  for (const moduleId of moduleAllow) {
    if (moduleId !== 'overview') {
      allowed.add(moduleId);
    }
  }
  return DESK_QUICK_LINK_ORDER.filter((id) => allowed.has(id)).map((id) => ({
    id,
    ...DESK_QUICK_LINK_META[id],
  }));
};