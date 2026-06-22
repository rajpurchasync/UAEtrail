/** UAE emirates and areas for location submission forms. */
export const UAE_EMIRATES = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
] as const;

export type UaeEmirate = (typeof UAE_EMIRATES)[number];

export const UAE_STATES_BY_EMIRATE: Record<UaeEmirate, string[]> = {
  'Abu Dhabi': ['Abu Dhabi City', 'Al Ain', 'Liwa', 'Al Dhafra'],
  Dubai: ['Dubai', 'Hatta'],
  Sharjah: ['Sharjah', 'Kalba', 'Khor Fakkan'],
  Ajman: ['Ajman'],
  'Umm Al Quwain': ['Umm Al Quwain'],
  'Ras Al Khaimah': ['RAK City', 'Jebel Jais', 'Wadi Shawka', 'Al Rams'],
  Fujairah: ['Fujairah', 'Dibba', 'Masafi'],
};

export const getStatesForEmirate = (emirate: string): string[] =>
  UAE_STATES_BY_EMIRATE[emirate as UaeEmirate] ?? [];
