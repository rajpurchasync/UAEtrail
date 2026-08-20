export type PhoneCountry = {
  code: string;
  dial: string;
  label: string;
};

/** Common dial codes for UAE Trails hosts (UAE first). */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: 'AE', dial: '+971', label: 'UAE (+971)' },
  { code: 'SA', dial: '+966', label: 'Saudi Arabia (+966)' },
  { code: 'OM', dial: '+968', label: 'Oman (+968)' },
  { code: 'QA', dial: '+974', label: 'Qatar (+974)' },
  { code: 'KW', dial: '+965', label: 'Kuwait (+965)' },
  { code: 'BH', dial: '+973', label: 'Bahrain (+973)' },
  { code: 'IN', dial: '+91', label: 'India (+91)' },
  { code: 'PK', dial: '+92', label: 'Pakistan (+92)' },
  { code: 'PH', dial: '+63', label: 'Philippines (+63)' },
  { code: 'GB', dial: '+44', label: 'United Kingdom (+44)' },
  { code: 'US', dial: '+1', label: 'United States (+1)' },
  { code: 'EG', dial: '+20', label: 'Egypt (+20)' },
  { code: 'JO', dial: '+962', label: 'Jordan (+962)' },
  { code: 'LB', dial: '+961', label: 'Lebanon (+961)' },
  { code: 'FR', dial: '+33', label: 'France (+33)' },
  { code: 'DE', dial: '+49', label: 'Germany (+49)' },
  { code: 'AU', dial: '+61', label: 'Australia (+61)' },
];

export const DEFAULT_PHONE_DIAL = '+971';
