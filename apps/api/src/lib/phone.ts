const digitsOnly = (value: string): string => value.replace(/\D/g, '');

export const formatE164Phone = (dialCode: string, nationalNumber: string): string => {
  const dialDigits = digitsOnly(dialCode);
  const nationalDigits = digitsOnly(nationalNumber);
  if (!dialDigits || !nationalDigits) return '';
  return `+${dialDigits}${nationalDigits}`;
};

export const isValidE164Phone = (phone: string): boolean => /^\+[1-9]\d{7,14}$/.test(phone);

export const isValidNationalPhone = (nationalNumber: string): boolean => {
  const digits = digitsOnly(nationalNumber);
  return digits.length >= 7 && digits.length <= 15;
};
