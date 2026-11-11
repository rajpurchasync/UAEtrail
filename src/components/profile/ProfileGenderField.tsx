import { USER_GENDER_OPTIONS, type UserGender } from '../../constants/userProfileOptions';

const optionClass = (active: boolean, disabled: boolean) =>
  [
    'rounded-xl border px-3 py-2.5 text-center text-sm font-semibold transition-colors',
    active
      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-600/10'
      : 'border-neutral-200 bg-white text-neutral-800 hover:border-emerald-200',
    disabled ? 'opacity-60 pointer-events-none' : '',
  ]
    .filter(Boolean)
    .join(' ');

type ProfileGenderFieldProps = {
  value: UserGender | '';
  onChange: (value: UserGender) => void;
  disabled?: boolean;
};

/** Compact gender picker — shared by profile edit and signup capture. */
export const ProfileGenderField = ({ value, onChange, disabled = false }: ProfileGenderFieldProps) => {
  const binary = USER_GENDER_OPTIONS.filter((option) => option.value !== 'prefer_not_to_say');
  const preferNot = USER_GENDER_OPTIONS.find((option) => option.value === 'prefer_not_to_say');

  return (
    <div className="space-y-2" role="group" aria-label="Gender">
      <div className="grid grid-cols-2 gap-2">
        {binary.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={optionClass(value === option.value, disabled)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {preferNot ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(preferNot.value)}
          className={`w-full ${optionClass(value === preferNot.value, disabled)} text-left px-4`}
        >
          {preferNot.label}
        </button>
      ) : null}
    </div>
  );
};
