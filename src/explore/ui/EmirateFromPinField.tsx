import { AppSelect } from '../../components/ui/AppSelect';
import { EXPLORE_FLOW, EXPLORE_SHAPE } from '../../config/exploreTheme';
import {
  EMIRATE_SELECT_OPTIONS,
  SUPPORTED_COUNTRIES,
  getRegionsForCountry,
  subdivisionNoun,
  type CountryCode,
} from '../../config/regions';

const selectClass = `w-full ${EXPLORE_SHAPE.control} border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900`;

const regionOptions = (country: CountryCode): Array<{ value: string; label: string }> =>
  country === 'AE'
    ? EMIRATE_SELECT_OPTIONS.map((option) => ({ value: option.key, label: option.label }))
    : getRegionsForCountry(country).map((region) => ({ value: region, label: region }));

type EmirateFromPinFieldProps = {
  inferred: string | null;
  countryCode: CountryCode;
  onCountryChange: (next: CountryCode) => void;
  value: string;
  onChange: (next: string) => void;
  pinned: boolean;
};

/** Country (level 3) and region (level 2). The region noun follows the country. */
export const EmirateFromPinField = ({
  inferred,
  countryCode,
  onCountryChange,
  value,
  onChange,
  pinned,
}: EmirateFromPinFieldProps) => {
  if (!pinned) return null;

  const noun = subdivisionNoun(countryCode);
  const options = regionOptions(countryCode);
  const selected = value || (countryCode === 'AE' ? inferred ?? '' : '');

  const changeCountry = (next: CountryCode) => {
    onCountryChange(next);
    const allowed = new Set(regionOptions(next).map((option) => option.value));
    const kept = next === 'AE' && inferred && allowed.has(inferred) ? inferred : '';
    if (!allowed.has(value)) onChange(kept);
  };

  return (
    <div className="mt-3 grid gap-3">
      <label className="block">
        <span className={`mb-1.5 block ${EXPLORE_FLOW.choiceCardTitle}`}>Country</span>
        <AppSelect
          className="w-full"
          value={countryCode}
          onChange={(next) => changeCountry(next as CountryCode)}
          aria-label="Country"
          options={SUPPORTED_COUNTRIES.map((country) => ({
            value: country.code,
            label: country.label,
          }))}
          inputClassName={selectClass}
        />
      </label>
      <label className="block">
        <span className={`mb-1.5 block ${EXPLORE_FLOW.choiceCardTitle}`}>{noun}</span>
        <AppSelect
          className="w-full"
          value={selected}
          onChange={onChange}
          placeholder={`Select ${noun.toLowerCase()}…`}
          aria-label={noun}
          options={options}
          inputClassName={selectClass}
        />
      </label>
    </div>
  );
};
