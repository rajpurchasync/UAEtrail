import { Lock } from 'lucide-react';
import { PRODUCT_SIGNUP_STEP_DOB } from '../../content/productNorthStar';
import { formatMemberDobDisplay } from '../../utils/memberDateOfBirthPicker';
import { computeAgeFromDateOfBirth } from '../../utils/profileAge';
import { ProfileFormField } from './ProfileFormSection';

type ProfileDateOfBirthDisplayProps = {
  dateOfBirth?: string | null;
};

/** DOB from signup — visible, not editable. */
export const ProfileDateOfBirthDisplay = ({ dateOfBirth }: ProfileDateOfBirthDisplayProps) => {
  const iso = dateOfBirth?.trim() ?? '';
  const display = iso ? formatMemberDobDisplay(iso) : null;
  const age = iso ? computeAgeFromDateOfBirth(iso) : null;

  return (
    <ProfileFormField label={PRODUCT_SIGNUP_STEP_DOB}>
      <div
        className="flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-neutral-200/80 bg-neutral-50/80 px-3.5 py-2.5"
        aria-readonly="true"
      >
        <p className="text-[15px] text-neutral-900">
          {display ? (
            <>
              <span className="font-medium">{display}</span>
              {age != null ? <span className="text-neutral-500"> · {age}</span> : null}
            </>
          ) : (
            <span className="text-neutral-400">—</span>
          )}
        </p>
        <Lock className="h-4 w-4 shrink-0 text-neutral-400" strokeWidth={2.25} aria-hidden />
      </div>
    </ProfileFormField>
  );
};
