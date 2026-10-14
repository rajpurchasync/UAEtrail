import {
  browseGroupRegionFilterLevel,
  BROWSE_GROUP_REGION_FILTER_LEVEL_BY_COUNTRY,
  readGroupRegionAtLevel,
  type GroupRegionLevels,
} from '@uaetrail/shared-types';

export const DEFAULT_BROWSE_COUNTRY_CODE = 'AE';

/** @see BROWSE_GROUP_REGION_FILTER_LEVEL_BY_COUNTRY in shared-types */
export const browseGroupRegionFilterLevelByCountry = BROWSE_GROUP_REGION_FILTER_LEVEL_BY_COUNTRY;

export { browseGroupRegionFilterLevel };

export const groupRegionTextAtBrowseFilterLevel = (
  levels: GroupRegionLevels | null | undefined,
  countryCode: string = DEFAULT_BROWSE_COUNTRY_CODE
): string | null => readGroupRegionAtLevel(levels, browseGroupRegionFilterLevel(countryCode));
