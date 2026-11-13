import type { DiscoveryCardKind, DiscoveryCardSource } from '@uaetrail/shared-types';
import { isGeographyMapSource } from '@uaetrail/shared-types';

export const SHARE_SHEET_TITLE_OUTING = 'Share outing';
export const SHARE_SHEET_TITLE_AREA = 'Share area';
export const SHARE_SHEET_TITLE_PLACE = 'Share place';
export const SHARE_SHEET_TITLE_DEFAULT = 'Share';

export type ShareSheetSurface = 'activity' | 'area' | 'place' | 'profile' | 'generic';

export const resolveShareSheetTitle = (surface?: ShareSheetSurface): string => {
  switch (surface) {
    case 'activity':
      return SHARE_SHEET_TITLE_OUTING;
    case 'area':
      return SHARE_SHEET_TITLE_AREA;
    case 'place':
      return SHARE_SHEET_TITLE_PLACE;
    case 'profile':
      return SHARE_SHEET_TITLE_DEFAULT;
    default:
      return SHARE_SHEET_TITLE_DEFAULT;
  }
};

export const SHARE_SHEET_SECTION_IN_APP = 'On UAE Trail';
export const SHARE_SHEET_SECTION_EXTERNAL = 'Share link';
export const SHARE_SHEET_IN_APP_GENERIC_CTA = 'Send to friends in the app';
export const SHARE_SHEET_IN_APP_GENERIC_HINT = 'Share the link in chat, groups, or DM';

/** Map peek / list row — infer sheet title from discovery card. */
export const shareSurfaceFromDiscoveryCard = (input: {
  kind: DiscoveryCardKind;
  source?: DiscoveryCardSource;
  activity?: unknown;
}): ShareSheetSurface => {
  if (input.kind === 'area') return 'area';
  if (input.activity) return 'activity';
  if (input.source && isGeographyMapSource(input.source)) return 'place';
  return 'generic';
};
