import { useEffect } from 'react';
import {
  formatTime24,
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  parseTime24,
  PERIOD_OPTIONS,
  snapMinuteToQuarter,
  type TimePeriod,
} from '../../utils/timePicker';
import { AppSelect } from './AppSelect';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  id?: string;
}

const inlineSelectClass =
  'min-h-0 h-11 flex-1 rounded-lg border-0 bg-transparent px-1 text-center text-base font-medium text-gray-900 shadow-none focus:ring-0';

const hourOptions = HOUR_OPTIONS.map((hour) => ({ value: String(hour), label: String(hour) }));
const minuteOptions = MINUTE_OPTIONS.map((minute) => ({
  value: String(minute),
  label: String(minute).padStart(2, '0'),
}));
const periodOptions = PERIOD_OPTIONS.map((period) => ({ value: period, label: period }));

/** Compact single-row time picker — hour, minute (15 min steps), AM/PM. */
export const TimePicker = ({ value, onChange, required, className = '', id }: TimePickerProps) => {
  const parts = parseTime24(value || '09:00');
  const minute = snapMinuteToQuarter(parts.minute);

  useEffect(() => {
    if (!value) return;
    const parsed = parseTime24(value);
    const snapped = snapMinuteToQuarter(parsed.minute);
    const normalized = formatTime24({ ...parsed, minute: snapped });
    if (normalized !== value) onChange(normalized);
  }, [value, onChange]);

  const update = (patch: Partial<typeof parts>) => {
    onChange(formatTime24({ ...parts, minute, ...patch }));
  };

  return (
    <div
      id={id}
      className={`flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-1 min-h-[44px] ${className}`}
      aria-required={required}
    >
      <AppSelect
        value={String(parts.hour)}
        onChange={(hour) => update({ hour: Number(hour) })}
        options={hourOptions}
        className="min-w-0 flex-1"
        inputClassName={inlineSelectClass}
        menuClassName="min-w-[5rem]"
        aria-label="Hour"
      />
      <span className="text-gray-400 font-semibold shrink-0">:</span>
      <AppSelect
        value={String(minute)}
        onChange={(minuteValue) => update({ minute: Number(minuteValue) })}
        options={minuteOptions}
        className="min-w-0 flex-1"
        inputClassName={inlineSelectClass}
        menuClassName="min-w-[5rem]"
        aria-label="Minute"
      />
      <AppSelect
        value={parts.period}
        onChange={(period) => update({ period: period as TimePeriod })}
        options={periodOptions}
        className="max-w-[4.5rem] shrink-0"
        inputClassName={inlineSelectClass}
        menuClassName="min-w-[5.5rem]"
        aria-label="AM or PM"
      />
    </div>
  );
};
