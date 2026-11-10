import type { HostJoinProfileSnippetDTO } from '@uaetrail/shared-types';

const formatGender = (gender: HostJoinProfileSnippetDTO['gender']): string | null => {
  if (gender === 'female') return 'Female';
  if (gender === 'male') return 'Male';
  if (gender === 'prefer_not_to_say') return 'Prefer not to say';
  return null;
};

type MemberJoinProfileHostBlockProps = {
  joinProfile: HostJoinProfileSnippetDTO | null | undefined;
  compact?: boolean;
};

/** Host-only audience fields shared when the outing has women-only or age rules. */
export const MemberJoinProfileHostBlock = ({
  joinProfile,
  compact = false,
}: MemberJoinProfileHostBlockProps) => {
  if (!joinProfile) return null;

  const genderLabel = joinProfile.gender != null ? formatGender(joinProfile.gender) : null;
  const ageBits: string[] = [];
  if (joinProfile.age != null) ageBits.push(`Age ${joinProfile.age}`);
  if (joinProfile.dateOfBirth) ageBits.push(`DOB ${joinProfile.dateOfBirth}`);
  else if (joinProfile.birthYear != null) ageBits.push(`Born ${joinProfile.birthYear}`);

  if (!genderLabel && ageBits.length === 0) return null;

  if (compact) {
    const parts = [...(genderLabel ? [genderLabel] : []), ...ageBits];
    return (
      <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400">
        <span className="font-semibold text-neutral-800 dark:text-neutral-200">Audience:</span>{' '}
        {parts.join(' · ')}
      </p>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-sky-100 bg-sky-50/60 px-3 py-2 text-xs text-neutral-800 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-neutral-100">
      <p className="font-semibold text-sky-900 dark:text-sky-200">Audience profile</p>
      {genderLabel ? (
        <p className="mt-1">
          <span className="text-neutral-500">Gender</span> · {genderLabel}
        </p>
      ) : null}
      {ageBits.length > 0 ? (
        <p>
          <span className="text-neutral-500">Age / birth</span> · {ageBits.join(' · ')}
        </p>
      ) : null}
    </div>
  );
};
