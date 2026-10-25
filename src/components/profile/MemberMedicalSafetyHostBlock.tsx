import type { MemberMedicalSafetyDTO } from '@uaetrail/shared-types';

type MemberMedicalSafetyHostBlockProps = {
  medicalSafety: MemberMedicalSafetyDTO | null | undefined;
  compact?: boolean;
};

/** Host / organizer read-only safety slice for join requests and roster. */
export const MemberMedicalSafetyHostBlock = ({
  medicalSafety,
  compact = false,
}: MemberMedicalSafetyHostBlockProps) => {
  if (!medicalSafety) return null;

  if (compact) {
    return (
      <p className="mt-1.5 text-xs text-neutral-600">
        <span className="font-semibold text-neutral-800">Safety:</span>{' '}
        {medicalSafety.bloodGroup} · {medicalSafety.medicalConditions} · ICE{' '}
        {medicalSafety.emergencyContactName} ({medicalSafety.emergencyContactPhone})
      </p>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2 text-xs text-neutral-800">
      <p className="font-semibold text-rose-900">Safety & emergency</p>
      <p className="mt-1">
        <span className="text-neutral-500">Blood group</span> · {medicalSafety.bloodGroup}
      </p>
      <p>
        <span className="text-neutral-500">Medical</span> · {medicalSafety.medicalConditions}
      </p>
      <p>
        <span className="text-neutral-500">Emergency</span> · {medicalSafety.emergencyContactName} ·{' '}
        {medicalSafety.emergencyContactPhone}
      </p>
    </div>
  );
};
