import {
  slugifyCommunityDiscoverName,
  type GeoRef,
  type MeCreateCommunityDiscoverDTO,
} from '@uaetrail/shared-types';
import { EXPLORE_REGION_PILL_LABELS, getRegionsForCountry, DEFAULT_COUNTRY } from '@/config/regions';

const emirateId = (label: string) =>
  label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildGeoRefForEmirateLabel = (label: string): GeoRef => {
  const areaId = emirateId(label);
  return {
    chain: [],
    countryId: 'ae',
    stateId: areaId,
    areaId,
    path: `United Arab Emirates/${label}`,
    names: {
      country: 'United Arab Emirates',
      state: label,
      area: label,
    },
    searchTokens: ['uae', areaId, label.toLowerCase()],
  };
};

/** UAE emirate keys for self-serve community create. */
export const COMMUNITY_CREATE_EMIRATE_OPTIONS = getRegionsForCountry(DEFAULT_COUNTRY).map((key) => ({
  key,
  label: EXPLORE_REGION_PILL_LABELS[key] ?? key,
}));

export const communityGeoRefForEmirateKey = (emirateKey: string): GeoRef => {
  const label = EXPLORE_REGION_PILL_LABELS[emirateKey] ?? emirateKey;
  return buildGeoRefForEmirateLabel(label);
};

/** Default geo for self-serve community create (Dubai). */
export const DEFAULT_COMMUNITY_CREATE_GEO: GeoRef = communityGeoRefForEmirateKey('Dubai');

export const buildDefaultCreateCommunityBody = (
  name: string,
  joinPolicy: MeCreateCommunityDiscoverDTO['joinPolicy'] = 'request',
  options?: {
    summary?: string | null;
    bannerUrl?: string | null;
    emirateKey?: string;
  }
): MeCreateCommunityDiscoverDTO => ({
  name: name.trim(),
  slug: slugifyCommunityDiscoverName(name),
  summary: options?.summary?.trim() || null,
  bannerUrl: options?.bannerUrl?.trim() || null,
  visibility: 'public',
  joinPolicy,
  geoRef: options?.emirateKey
    ? communityGeoRefForEmirateKey(options.emirateKey)
    : DEFAULT_COMMUNITY_CREATE_GEO,
});