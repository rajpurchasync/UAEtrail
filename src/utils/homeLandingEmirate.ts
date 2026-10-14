import { HOME_EMIRATE_FILTER_ORDER } from '../content/homeMarketing';

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

export const emirateLabelFromId = (id: string): string =>
  HOME_EMIRATE_FILTER_ORDER.find((e) => e.id === id)?.label ?? id;
