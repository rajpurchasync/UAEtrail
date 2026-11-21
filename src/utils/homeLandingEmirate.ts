import { EXPLORE_REGION_PILL_LABELS } from '../config/regions';

const REGION_TO_ID: Record<string, string> = {
  dubai: 'dubai',
  'abu dhabi': 'abu-dhabi',
  abudhabi: 'abu-dhabi',
  sharjah: 'sharjah',
  rak: 'rak',
  'ras al khaimah': 'rak',
  fujairah: 'fujairah',
  ajman: 'ajman',
  uaq: 'uaq',
  'umm al quwain': 'uaq'
};

export const emirateIdFromRegion = (region: string): string | null => {
  const key = region.trim().toLowerCase();
  if (REGION_TO_ID[key]) return REGION_TO_ID[key];
  for (const [needle, id] of Object.entries(REGION_TO_ID)) {
    if (key.includes(needle)) return id;
  }
  return null;
};

const EMIRATE_ID_TO_REGION_KEY: Record<string, string> = {
  dubai: 'Dubai',
  'abu-dhabi': 'Abu Dhabi',
  sharjah: 'Sharjah',
  rak: 'RAK',
  fujairah: 'Fujairah',
  ajman: 'Ajman',
  uaq: 'Umm Al Quwain',
};

export const emirateLabelFromId = (id: string): string => {
  if (id === 'all') return 'All';
  const regionKey = EMIRATE_ID_TO_REGION_KEY[id];
  if (regionKey) return EXPLORE_REGION_PILL_LABELS[regionKey] ?? regionKey;
  return id.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};
