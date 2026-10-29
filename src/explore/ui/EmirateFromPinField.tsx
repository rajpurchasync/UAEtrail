import { AppSelect } from '../../components/ui/AppSelect';
import { EXPLORE_FLOW, EXPLORE_SHAPE } from '../../config/exploreTheme';
import { EMIRATE_SELECT_OPTIONS } from '../../config/regions';

const emirateLabel = (key: string): string =>
  EMIRATE_SELECT_OPTIONS.find((row) => row.key === key)?.label ?? key;

type EmirateFromPinFieldProps = {
  inferred: string | null;
  value: string;
  onChange: (next: string) => void;
  pinned: boolean;
};

/** Search/Home emirate pills: show inferred label, else a required dropdown. */
export const EmirateFromPinField = ({
  inferred,
  value,
  onChange,
  pinned,
}: EmirateFromPinFieldProps) => {
  if (!pinned) return null;
  if (inferred) {
    return (
      <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
        Emirate from your pin: <span className="font-semibold">{emirateLabel(inferred)}</span>
      </p>
    );
  }
  return (
    <label className="mt-3 mb-4 block">
      <span className={`mb-1.5 block ${EXPLORE_FLOW.choiceCardTitle}`}>Emirate</span>
      <p className="mb-2 text-xs text-neutral-600">
        We couldn’t match Dubai, Ras Al Khaimah, Sharjah, or the other search and Home filters from
        this pin. Choose one — this is required.
      </p>
      <AppSelect
        className="w-full"
        value={value}
        onChange={onChange}
        placeholder="Select emirate…"
        options={EMIRATE_SELECT_OPTIONS.map((option) => ({
          value: option.key,
          label: option.label,
        }))}
        inputClassName={`w-full ${EXPLORE_SHAPE.control} border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900`}
      />
    </label>
  );
};
