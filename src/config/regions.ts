/** GCC country catalog — extend as platform expands beyond UAE. */
export const SUPPORTED_COUNTRIES = [
  { code: 'AE', label: 'United Arab Emirates', default: true },
  { code: 'SA', label: 'Saudi Arabia' },
  { code: 'OM', label: 'Oman' },
  { code: 'QA', label: 'Qatar' },
  { code: 'BH', label: 'Bahrain' },
  { code: 'KW', label: 'Kuwait' }
] as const;

export type CountryCode = (typeof SUPPORTED_COUNTRIES)[number]['code'];

export const DEFAULT_COUNTRY: CountryCode = 'AE';

/** Regions per country — used in explore filters and venue forms. */
const REGIONS_BY_COUNTRY: Record<CountryCode, string[]> = {
  AE: ['Dubai', 'RAK', 'Fujairah', 'Abu Dhabi', 'Al Ain', 'Sharjah'],
  SA: ['Riyadh', 'Jeddah', 'Abha', 'AlUla', 'Taif', 'Dammam'],
  OM: ['Muscat', 'Nizwa', 'Salalah', 'Jebel Shams', 'Wahiba Sands'],
  QA: ['Doha', 'Al Khor', 'Mesaieed', 'Inland Sea'],
  BH: ['Manama', 'Muharraq', 'Southern Governorate'],
  KW: ['Kuwait City', 'Jahra', 'Ahmadi']
};

export const getRegionsForCountry = (code: CountryCode = DEFAULT_COUNTRY): string[] =>
  REGIONS_BY_COUNTRY[code] ?? REGIONS_BY_COUNTRY.AE;

/** Level-2 label for a country: emirate, province, governorate, or region. */
export const subdivisionNoun = (code: CountryCode): string => {
  switch (code) {
    case 'AE':
      return 'Emirate';
    case 'SA':
      return 'Province';
    case 'OM':
    case 'BH':
    case 'KW':
      return 'Governorate';
    case 'QA':
      return 'Municipality';
    default:
      return 'Region';
  }
};

export const placeRegionReady = (
  country: CountryCode,
  region: string,
  inferred: string | null
): boolean => (country === 'AE' ? Boolean(region.trim() || inferred) : Boolean(region.trim()));

/** Human labels for explore venue filter pills (filter value → display). */
export const EXPLORE_REGION_PILL_LABELS: Record<string, string> = {
  'Abu Dhabi': 'Abu Dhabi',
  Dubai: 'Dubai',
  RAK: 'Ras Al Khaimah',
  Fujairah: 'Fujairah',
  'Al Ain': 'Al Ain',
  Sharjah: 'Sharjah',
};

export const getExploreRegionPillOptions = (code: CountryCode = DEFAULT_COUNTRY) => [
  { key: 'all', label: 'All UAE' },
  ...getRegionsForCountry(code).map((region) => ({
    key: region,
    label: EXPLORE_REGION_PILL_LABELS[region] ?? region,
  })),
];

/** Multi-select state/emirate options for venue list filtering. */
export const getVenueStateFilterOptions = (code: CountryCode = DEFAULT_COUNTRY) =>
  getRegionsForCountry(code).map((region) => ({
    key: region,
    label: EXPLORE_REGION_PILL_LABELS[region] ?? region,
  }));

/** Emirate picker when a pin cannot be matched — same labels as search/Home, plus Ajman / UAQ. */
export const EMIRATE_SELECT_OPTIONS: Array<{ key: string; label: string }> = [
  ...getVenueStateFilterOptions('AE'),
  { key: 'Ajman', label: 'Ajman' },
  { key: 'Umm Al Quwain', label: 'Umm Al Quwain' },
];

export type CountrySubdivisionOption = { value: string; label: string };

/**
 * Canonical country → state/emirate/province list for forms (explore filters + hosting venue picker).
 * Not derived from catalog rows.
 */
export const getSubdivisionOptionsForCountry = (
  code: CountryCode = DEFAULT_COUNTRY
): CountrySubdivisionOption[] => {
  if (code === 'AE') {
    return EMIRATE_SELECT_OPTIONS.map(({ key, label }) => ({ value: key, label }));
  }
  return getRegionsForCountry(code).map((region) => ({
    value: region,
    label: EXPLORE_REGION_PILL_LABELS[region] ?? region,
  }));
};

export const getMapBounds = (code: CountryCode = DEFAULT_COUNTRY): { west: number; south: number; east: number; north: number } => {
  const bounds: Record<CountryCode, { west: number; south: number; east: number; north: number }> = {
    AE: { west: 51.5, south: 22.5, east: 56.5, north: 26.5 },
    SA: { west: 34.5, south: 16.0, east: 55.5, north: 32.0 },
    OM: { west: 52.0, south: 16.5, east: 59.8, north: 26.4 },
    QA: { west: 50.7, south: 24.4, east: 51.7, north: 26.2 },
    BH: { west: 50.3, south: 25.7, east: 50.8, north: 26.3 },
    KW: { west: 46.5, south: 28.5, east: 48.5, north: 30.1 }
  };
  return bounds[code] ?? bounds.AE;
};
