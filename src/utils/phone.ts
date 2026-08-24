import { DEFAULT_PHONE_DIAL, PHONE_COUNTRIES } from '../constants/phoneCountries';

export const digitsOnly = (value: string): string => value.replace(/\D/g, '');

export const formatE164Phone = (dialCode: string, nationalNumber: string): string => {
  const dialDigits = digitsOnly(dialCode);
  const nationalDigits = digitsOnly(nationalNumber);
  if (!dialDigits || !nationalDigits) return '';
  return `+${dialDigits}${nationalDigits}`;
};

export const formatPhoneDisplay = (dialCode: string, nationalNumber: string): string => {
  const e164 = formatE164Phone(dialCode, nationalNumber);
  if (!e164) return '';
  if (dialCode === DEFAULT_PHONE_DIAL && nationalNumber.trim()) {
    const local = digitsOnly(nationalNumber);
    if (local.length === 9) {
      return `${dialCode} ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
    }
  }
  return `${dialCode} ${nationalNumber.trim()}`;
};

export const isValidNationalPhone = (nationalNumber: string): boolean => {
  const digits = digitsOnly(nationalNumber);
  return digits.length >= 7 && digits.length <= 15;
};

export const splitStoredPhone = (value?: string | null): { dial: string; national: string } => {
  if (!value?.trim()) return { dial: DEFAULT_PHONE_DIAL, national: '' };
  const trimmed = value.trim();
  const match = [...PHONE_COUNTRIES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((country) => trimmed.startsWith(country.dial));
  if (match) {
    return { dial: match.dial, national: trimmed.slice(match.dial.length).trim() };
  }
  return { dial: DEFAULT_PHONE_DIAL, national: trimmed.replace(/^\+/, '') };
};
