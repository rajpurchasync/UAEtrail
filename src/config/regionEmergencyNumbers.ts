/** National emergency lines — future: load from admin platform config per country. */
export type EmergencyHotline = {
  id: string;
  label: string;
  number: string;
  description?: string;
};

export type RegionEmergencyNumbersConfig = {
  regionCode: string;
  countryLabel: string;
  hotlines: EmergencyHotline[];
};

export const UAE_EMERGENCY_NUMBERS: RegionEmergencyNumbersConfig = {
  regionCode: 'AE',
  countryLabel: 'United Arab Emirates',
  hotlines: [
    { id: 'police', label: 'Police', number: '999', description: 'Life-threatening emergencies' },
    { id: 'ambulance', label: 'Ambulance', number: '998' },
    { id: 'fire', label: 'Fire', number: '997' },
    { id: 'coastguard', label: 'Coast guard', number: '996' },
  ],
};

/** Resolve hotlines for an activity/place region (defaults to UAE until admin config ships). */
export const resolveRegionEmergencyNumbers = (
  _region?: string | null
): RegionEmergencyNumbersConfig => UAE_EMERGENCY_NUMBERS;
