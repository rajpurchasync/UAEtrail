import { useMemo, useState } from 'react';
import {
  MEMBER_VEHICLE_COLORS,
  type MemberVehicleColor,
  type MemberVehicleDTO,
  type UpsertMemberVehicleInput,
} from '@uaetrail/shared-types';
import { AppButton } from '../mobile/AppButton';
import { EXPLORE_FLOW } from '../../config/exploreTheme';
import { MEMBER_VEHICLE_COLOR_LABELS } from './memberVehicleColorChrome';
import { MemberVehicleCarIcon } from './MemberVehicleCarIcon';

const currentYear = new Date().getFullYear();

type MemberVehicleFormProps = {
  initial?: MemberVehicleDTO | null;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (input: UpsertMemberVehicleInput) => void | Promise<void>;
};

export const MemberVehicleForm = ({
  initial,
  submitLabel,
  busy = false,
  onSubmit,
}: MemberVehicleFormProps) => {
  const [make, setMake] = useState(initial?.make ?? '');
  const [model, setModel] = useState(initial?.model ?? '');
  const [color, setColor] = useState<MemberVehicleColor>(initial?.color ?? 'white');
  const [year, setYear] = useState(String(initial?.year ?? currentYear));
  const [plateNumber, setPlateNumber] = useState(initial?.plateNumber ?? '');
  const [error, setError] = useState<string | null>(null);

  const previewColor = useMemo(() => color, [color]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const parsedYear = Number(year);
    if (!make.trim() || !model.trim()) {
      setError('Enter make and model.');
      return;
    }
    if (!Number.isInteger(parsedYear) || parsedYear < 1990 || parsedYear > currentYear + 1) {
      setError(`Enter a year between 1990 and ${currentYear + 1}.`);
      return;
    }
    if (plateNumber.trim().length < 2) {
      setError('Enter your number plate.');
      return;
    }
    await onSubmit({
      make: make.trim(),
      model: model.trim(),
      color,
      year: parsedYear,
      plateNumber: plateNumber.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
        <MemberVehicleCarIcon color={previewColor} size="lg" />
        <div>
          <p className="text-sm font-semibold text-neutral-900">Your car on rides</p>
          <p className="text-xs text-neutral-600">Plate stays private — riders only see make, model, color, and year.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-1 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Make</span>
          <input
            value={make}
            onChange={(e) => setMake(e.target.value)}
            className="ios-input text-[15px]"
            placeholder="Toyota"
            maxLength={40}
          />
        </label>
        <label className="col-span-1 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Model</span>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="ios-input text-[15px]"
            placeholder="Prado"
            maxLength={40}
          />
        </label>
        <label className="col-span-1 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Year</span>
          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            inputMode="numeric"
            className="ios-input text-[15px]"
          />
        </label>
        <label className="col-span-1 block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Plate</span>
          <input
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
            className="ios-input text-[15px] uppercase"
            placeholder="A 12345"
            maxLength={15}
          />
        </label>
      </div>

      <div>
        <p className={`mb-2 ${EXPLORE_FLOW.choiceCardTitle}`}>Color</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {MEMBER_VEHICLE_COLORS.map((option) => {
            const active = color === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setColor(option)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border p-2 ${active ? 'border-emerald-500 bg-emerald-50/80' : 'border-neutral-200 bg-white'}`}
              >
                <MemberVehicleCarIcon color={option} size="sm" />
                <span className="text-[11px] font-semibold text-neutral-800">
                  {MEMBER_VEHICLE_COLOR_LABELS[option]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <AppButton type="submit" disabled={busy} className="w-full">
        {busy ? 'Saving…' : submitLabel}
      </AppButton>
    </form>
  );
};
