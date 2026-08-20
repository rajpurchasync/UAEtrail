import { DEFAULT_PHONE_DIAL, PHONE_COUNTRIES } from '../../constants/phoneCountries';

interface PhoneInputProps {
  dialCode: string;
  nationalNumber: string;
  onDialCodeChange: (dialCode: string) => void;
  onNationalNumberChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const PhoneInput = ({
  dialCode,
  nationalNumber,
  onDialCodeChange,
  onNationalNumberChange,
  required = false,
  disabled = false,
  className = '',
}: PhoneInputProps) => (
  <div className={`flex gap-2 ${className}`}>
    <select
      value={dialCode || DEFAULT_PHONE_DIAL}
      onChange={(e) => onDialCodeChange(e.target.value)}
      required={required}
      disabled={disabled}
      className="w-[42%] min-w-[7.5rem] border rounded-xl px-2 py-2.5 text-sm bg-white"
      aria-label="Country code"
    >
      {PHONE_COUNTRIES.map((country) => (
        <option key={country.code} value={country.dial}>
          {country.label}
        </option>
      ))}
    </select>
    <input
      type="tel"
      inputMode="tel"
      required={required}
      disabled={disabled}
      value={nationalNumber}
      onChange={(e) => onNationalNumberChange(e.target.value)}
      className="flex-1 min-w-0 border rounded-xl px-3 py-2.5 text-sm"
      placeholder="50 123 4567"
      aria-label="Mobile number"
    />
  </div>
);
