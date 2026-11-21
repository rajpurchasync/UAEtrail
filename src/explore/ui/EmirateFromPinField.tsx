import { AppSelect } from '../../components/ui/AppSelect';
import { EXPLORE_FLOW, EXPLORE_SHAPE } from '../../config/exploreTheme';
import {
  SUPPORTED_COUNTRIES,
  getRegionsForCountry,
  subdivisionNoun,
  type CountryCode,
} from '../../config/regions';
import { useVenueStateFilterOptions } from '../../config/useVenueStateFilterOptions';

const selectClass = `w-full ${EXPLORE_SHAPE.control} border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900`;

type EmirateFromPinFieldProps = {
  inferred: string | null;
  countryCode: CountryCode;
  onCountryChange: (next: CountryCode) => void;
  value: string;
  onChange: (next: string) => void;
  pinned: boolean;
  /** Host destination is UAE-only — hide the country control. Add-on-map keeps GCC. */
  countryLocked?: boolean;
};

/** Country (level 3) and region (level 2). The region noun follows the country. */
export const EmirateFromPinField = ({
  inferred,
  countryCode,
  onCountryChange,
  value,
  onChange,
  pinned,
  countryLocked = false,
}: EmirateFromPinFieldProps) => {
  const uaeVenueOptions = useVenueStateFilterOptions('AE');
  if (!pinned) return null;

  const regionKeysForCountry = (code: CountryCode): string[] =>
    code === 'AE'
      ? uaeVenueOptions.map((option) => option.key)
      : getRegionsForCountry(code);

  const noun = subdivisionNoun(countryCode);
  const options = regionKeysForCountry(countryCode).map((region) => ({
    value: region,
    label:
      countryCode === 'AE'
        ? uaeVenueOptions.find((option) => option.key === region)?.label ?? region
        : region,
  }));
  const selected = value || (countryCode === 'AE' ? inferred ?? '' : '');

  const changeCountry = (next: CountryCode) => {
    onCountryChange(next);
    const allowed = new Set(regionKeysForCountry(next));
    const kept = next === 'AE' && inferred && allowed.has(inferred) ? inferred : '';
    if (!allowed.has(value)) onChange(kept);
  };

  return (
    <div className="mt-3 grid gap-3">
      {countryLocked ? null : (
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
      )}
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
