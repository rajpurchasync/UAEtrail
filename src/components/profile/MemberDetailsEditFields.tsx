import {
  USER_COUNTRY_OPTIONS,
  type UserCountryCode,
  type UserGender,
} from '../../constants/userProfileOptions';
import {
  PRODUCT_SIGNUP_STEP_DOB,
  PRODUCT_SIGNUP_STEP_GENDER,
  PRODUCT_SIGNUP_STEP_LANGUAGES,
  PRODUCT_SIGNUP_STEP_LOCATION,
} from '../../content/productNorthStar';
import type { SignupProfileStep } from '../../utils/signupProfileSteps';
import { SignupLanguagePicker } from '../signup/SignupLanguagePicker';
import { MemberDateOfBirthField } from './MemberDateOfBirthField';
import { ProfileFormField, profileFormFieldLabelClass } from './ProfileFormSection';
import { ProfileGenderField } from './ProfileGenderField';

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <span className={`mb-1.5 block ${profileFormFieldLabelClass}`}>{children}</span>
);

const countrySelectClass =
  'ios-input w-full min-h-[52px] appearance-none rounded-xl border border-neutral-200 bg-white px-4 text-[16px] font-medium text-neutral-900 disabled:opacity-60';

export type MemberDetailsFormValue = {
  dateOfBirth: string;
  gender: UserGender | '';
  countryCode: UserCountryCode | '';
  languages: string[];
};

interface MemberDetailsEditFieldsProps {
  value: MemberDetailsFormValue;
  onChange: (patch: Partial<MemberDetailsFormValue>) => void;
  disabled?: boolean;
  layout?: 'stack' | 'step';
  step?: SignupProfileStep;
}

export const MemberDetailsEditFields = ({
  value,
  onChange,
  disabled = false,
  layout = 'stack',
  step,
}: MemberDetailsEditFieldsProps) => {
  const dobField = (
    <>
      {layout === 'stack' ? <FieldLabel>{PRODUCT_SIGNUP_STEP_DOB}</FieldLabel> : null}
      <MemberDateOfBirthField
        value={value.dateOfBirth}
        onChange={(dateOfBirth) => onChange({ dateOfBirth })}
        disabled={disabled}
        size={layout === 'step' ? 'step' : 'default'}
      />
    </>
  );

  const genderField = (
    <>
      {layout === 'stack' ? <FieldLabel>{PRODUCT_SIGNUP_STEP_GENDER}</FieldLabel> : null}
      <ProfileGenderField
        value={value.gender}
        disabled={disabled}
        onChange={(gender) => onChange({ gender })}
      />
    </>
  );

  const countryField = (
    <>
      {layout === 'stack' ? <FieldLabel>{PRODUCT_SIGNUP_STEP_LOCATION}</FieldLabel> : null}
      <select
        className={countrySelectClass}
        value={value.countryCode}
        disabled={disabled}
        onChange={(event) =>
          onChange({ countryCode: event.target.value as UserCountryCode })
        }
      >
        <option value="">Select country</option>
        {USER_COUNTRY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </>
  );

  const languagesField =
    layout === 'stack' ? (
      <ProfileFormField label={PRODUCT_SIGNUP_STEP_LANGUAGES}>
        <SignupLanguagePicker value={value.languages} onChange={(languages) => onChange({ languages })} />
      </ProfileFormField>
    ) : (
      <SignupLanguagePicker value={value.languages} onChange={(languages) => onChange({ languages })} />
    );

  if (layout === 'step' && step) {
    if (step === 'dateOfBirth') return <div>{dobField}</div>;
    if (step === 'gender') return <div>{genderField}</div>;
    if (step === 'countryCode') return <div>{countryField}</div>;
    return null;
  }

  return (
    <div className="space-y-5">
      <div>{dobField}</div>
      <div>{genderField}</div>
      <div>{languagesField}</div>
      <div>{countryField}</div>
    </div>
  );
};

export const validateMemberDetailsForm = (value: MemberDetailsFormValue): string | null => {
  if (!value.dateOfBirth.trim()) return 'Select your date of birth.';
  if (!value.gender) return 'Select how you identify.';
  if (value.languages.length === 0) return 'Add at least one language.';
  if (!value.countryCode) return 'Select where you are based.';
  return null;
};
