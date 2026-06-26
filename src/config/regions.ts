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

/** Regions per country — used in Discovery filters and location forms. */
export const REGIONS_BY_COUNTRY: Record<CountryCode, string[]> = {
  AE: ['Dubai', 'RAK', 'Fujairah', 'Abu Dhabi', 'Al Ain', 'Sharjah'],
  SA: ['Riyadh', 'Jeddah', 'Abha', 'AlUla', 'Taif', 'Dammam'],
  OM: ['Muscat', 'Nizwa', 'Salalah', 'Jebel Shams', 'Wahiba Sands'],
  QA: ['Doha', 'Al Khor', 'Mesaieed', 'Inland Sea'],
  BH: ['Manama', 'Muharraq', 'Southern Governorate'],
  KW: ['Kuwait City', 'Jahra', 'Ahmadi']
};

export const getRegionsForCountry = (code: CountryCode = DEFAULT_COUNTRY): string[] =>
  REGIONS_BY_COUNTRY[code] ?? REGIONS_BY_COUNTRY.AE;

/** Human labels for discovery location filter pills (filter value → display). */
export const DISCOVERY_REGION_PILL_LABELS: Record<string, string> = {
  'Abu Dhabi': 'Abu Dhabi',
  Dubai: 'Dubai',
  RAK: 'Ras Al Khaimah',
  Fujairah: 'Fujairah',
  'Al Ain': 'Al Ain',
  Sharjah: 'Sharjah',
};

export const getDiscoveryRegionPillOptions = (code: CountryCode = DEFAULT_COUNTRY) => [
  { key: 'all', label: 'All UAE' },
  ...getRegionsForCountry(code).map((region) => ({
    key: region,
    label: DISCOVERY_REGION_PILL_LABELS[region] ?? region,
  })),
];

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
