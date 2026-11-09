import type { ActivityDetailDTO } from '@uaetrail/shared-types';

const fitnessLabel = (f: NonNullable<ActivityDetailDTO['audience']>['fitness']): string => {
  switch (f) {
    case 'easy':
      return 'Easy';
    case 'moderate':
      return 'Moderate';
    case 'challenging':
      return 'Challenging';
    case 'expert':
      return 'Expert';
    default:
      return '';
  }
};

/** Non-empty lines for audience / safety card (plan §4, §13.4). */
export const buildActivityAudienceLines = (activity: ActivityDetailDTO): string[] => {
  const a = activity.audience;
  if (!a) return [];
  const lines: string[] = [];
  if (a.womenOnly) {
    lines.push('Women only');
  }
  if (a.kidsWelcome) {
    lines.push(
      typeof a.minAge === 'number' && a.minAge > 0
        ? `Kids welcome (minimum age ${a.minAge})`
        : 'Kids welcome'
    );
  }
  if (a.petsAllowed) {
    lines.push('Pets allowed');
  }
  if (a.fitness && a.fitness !== 'unknown') {
    const base = fitnessLabel(a.fitness);
    const note = a.fitnessNote?.trim();
    lines.push(note ? `${base} fitness — ${note}` : `${base} fitness`);
  }
  if (a.languages && a.languages.length > 0) {
    lines.push(`Host languages: ${a.languages.join(', ')}`);
  }
  if (a.accessibility?.trim()) {
    lines.push(`Accessibility: ${a.accessibility.trim()}`);
  }
  return lines;
};

export const activityHasAudiencePresentation = (activity: ActivityDetailDTO): boolean =>
  buildActivityAudienceLines(activity).length > 0;

export const activityHasEmergencyContact = (activity: ActivityDetailDTO): boolean => {
  const emerg = activity.activityPrivateDetails?.emergencyContact;
  return Boolean(emerg?.name?.trim() && emerg?.phone?.trim());
};
