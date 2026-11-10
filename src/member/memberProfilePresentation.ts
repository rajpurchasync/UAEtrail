import type { MemberProfileBrowseLens } from '@uaetrail/shared-types';

export type MemberProfilePresentationMode = 'host' | 'social';

const LENS_VALUES: MemberProfileBrowseLens[] = [
  'organic',
  'discover',
  'friends',
  'available',
  'host',
];

export const parseMemberProfileBrowseLens = (search: string): MemberProfileBrowseLens => {
  const params = new URLSearchParams(search);
  const source = params.get('source')?.trim();
  if (source && LENS_VALUES.includes(source as MemberProfileBrowseLens)) {
    return source as MemberProfileBrowseLens;
  }
  if (params.get('discover') === '1' || params.get('from') === 'discover') return 'discover';
  return 'organic';
};

export const presentationFromBrowseLens = (
  lens: MemberProfileBrowseLens,
  isHost: boolean
): MemberProfilePresentationMode => {
  if (lens === 'host') return 'host';
  if (lens === 'friends') return 'social';
  if (lens === 'organic' && isHost) return 'host';
  return 'social';
};

export const browseLensForPresentation = (mode: MemberProfilePresentationMode): MemberProfileBrowseLens =>
  mode === 'host' ? 'host' : 'friends';

/** Viewer may see trusted social fields and host surfaces. */
export const memberProfileCanTogglePresentation = (input: {
  canViewFullProfile: boolean;
  isHost: boolean;
  activitiesHosted: number;
  publishingTenantId?: string | null;
}): boolean => {
  const hostSurface =
    input.isHost || input.activitiesHosted > 0 || Boolean(input.publishingTenantId?.trim());
  return input.canViewFullProfile && hostSurface;
};
