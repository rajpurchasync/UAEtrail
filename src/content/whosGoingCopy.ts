/**
 * Who's going — browse panel + map entry copy (voice: docs/NORTHSTAR.md).
 */

export const WHOS_GOING_MAP_BUTTON_LABEL = "Who's going?";

export const whosGoingMapButtonAriaLabel = (totalJoining: number): string =>
  totalJoining > 0
    ? `Who's going? ${totalJoining} people joining outings`
    : "Who's going? Find friends and people on upcoming trips";

export const WHOS_GOING_DISCOVER_LOADING = 'Finding people who are getting outside…';

export const whosGoingDiscoverQuotaLine = (remaining: number, limit: number): string =>
  `${remaining} of ${limit} profile views left this month`;

export const WHOS_GOING_DISCOVER_QUOTA_UPGRADE_LINK = 'Go Pro';
export const WHOS_GOING_DISCOVER_QUOTA_UPGRADE_SUFFIX = 'to keep meeting people through Discover.';

export const WHOS_GOING_DISCOVER_EMPTY_DIRECTORY =
  'No members to show yet — check back as more people join outings.';

export const WHOS_GOING_DISCOVERY_UPGRADE_TITLE = 'Discovery limit reached';
export const WHOS_GOING_DISCOVERY_UPGRADE_BODY =
  'Free members can open five new profiles from Discover each month. Pro members get unlimited discovery.';
export const WHOS_GOING_DISCOVERY_UPGRADE_CTA = 'See Pro options';
