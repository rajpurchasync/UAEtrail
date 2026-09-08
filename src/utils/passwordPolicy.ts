export const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', test: (password: string) => password.length >= 8 },
  { id: 'upper', label: 'One uppercase letter', test: (password: string) => /[A-Z]/.test(password) },
  { id: 'lower', label: 'One lowercase letter', test: (password: string) => /[a-z]/.test(password) },
  { id: 'number', label: 'One number', test: (password: string) => /[0-9]/.test(password) },
] as const;

export const getPasswordValidationError = (password: string): string | null => {
  const failed = PASSWORD_REQUIREMENTS.find((rule) => !rule.test(password));
  return failed ? `Password must include ${failed.label.toLowerCase()}.` : null;
};
