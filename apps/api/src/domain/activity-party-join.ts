import { ApiError } from '../lib/api-error.js';

const kidsWelcomeFromRequirements = (requirements: string[]): boolean => {
  const normalized = requirements.map((line) => line.trim().toLowerCase());
  if (normalized.some((line) => line === 'no children')) return false;
  if (normalized.some((line) => line.startsWith('ages '))) return true;
  return normalized.some((line) => line.includes('kids welcome') || line.includes('children welcome'));
};

export const assertPartyKidsAllowed = (
  kids: number,
  requirements: string[],
  kidsWelcome?: boolean
): void => {
  if (kids <= 0) return;
  const normalized = requirements.map((line) => line.trim().toLowerCase());
  if (normalized.some((line) => line === 'no children')) {
    throw new ApiError(400, 'kids_not_allowed', 'This outing does not allow children.');
  }
  if (kidsWelcome === false) {
    throw new ApiError(400, 'kids_not_allowed', 'This outing does not allow children.');
  }
  if (kidsWelcome === true) return;
  if (!kidsWelcomeFromRequirements(requirements)) {
    throw new ApiError(400, 'kids_not_allowed', 'This outing does not allow children.');
  }
};
