import { findLatestHostApplicationByApplicant } from './host-applications-store.js';

export const parseHostDetailsFromMetadata = (metadata: unknown) => {
  if (!metadata || typeof metadata !== 'object') return {};
  const m = metadata as Record<string, unknown>;
  const dateOfBirth = typeof m.dateOfBirth === 'string' ? m.dateOfBirth : undefined;
  const computeAge = (value: string): number | undefined => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
    const dob = new Date(`${value}T00:00:00`);
    if (Number.isNaN(dob.getTime())) return undefined;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
    return age >= 0 ? age : undefined;
  };
  return {
    experience: typeof m.experience === 'string' ? m.experience : undefined,
    languages: typeof m.languages === 'string' ? m.languages : undefined,
    age: dateOfBirth ? computeAge(dateOfBirth) : undefined,
    certificates: typeof m.certificates === 'string' ? m.certificates : undefined,
    notableHikes: typeof m.notableHikes === 'string' ? m.notableHikes : undefined,
    nationality: typeof m.nationality === 'string' ? m.nationality : undefined,
    residence: typeof m.residence === 'string' ? m.residence : undefined,
  };
};

export const loadHostDetailsForUser = async (userId: string) => {
  const application = await findLatestHostApplicationByApplicant(userId);
  return parseHostDetailsFromMetadata(application?.metadata);
};
