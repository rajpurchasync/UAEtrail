import type { ReactNode } from 'react';
import type { ExploreClockStyle } from '@uaetrail/shared-types';
import {
  writeDisplayPreferences,
  type ThemePreference,
  type UnitSystem,
} from '../../preferences/displayPreferences';
import { useDisplayPreferences } from '../../preferences/useDisplayPreferences';

const Choice = <T extends string>({
  value,
  current,
  label,
  onSelect,
}: {
  value: T;
  current: T;
  label: string;
  onSelect: (value: T) => void;
}) => {
  const selected = value === current;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(value)}
      className={`min-h-9 flex-1 rounded-xl px-2 text-sm font-semibold transition ${
        selected ? 'display-choice-on bg-white text-emerald-800 shadow-sm' : 'text-neutral-600'
      }`}
    >
      {label}
    </button>
  );
};

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-center gap-3 px-4 py-3">
    <p className="w-24 shrink-0 text-sm font-semibold text-neutral-900">{label}</p>
    <div className="flex min-w-0 flex-1 rounded-2xl bg-neutral-100 p-0.5">{children}</div>
  </div>
);

export const DisplayPreferencesSection = () => {
  const preferences = useDisplayPreferences();

  const setTheme = (theme: ThemePreference) => writeDisplayPreferences({ theme });
  const setClock = (clock: ExploreClockStyle) => writeDisplayPreferences({ clock });
  const setUnits = (units: UnitSystem) => writeDisplayPreferences({ units });

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm divide-y divide-neutral-100">
      <h2 className="px-4 pb-1 pt-3 text-sm font-semibold text-neutral-500">Display</h2>
      <Row label="Theme">
        <Choice value="system" current={preferences.theme} label="System" onSelect={setTheme} />
        <Choice value="light" current={preferences.theme} label="Light" onSelect={setTheme} />
        <Choice value="dark" current={preferences.theme} label="Dark" onSelect={setTheme} />
      </Row>
      <Row label="Time">
        <Choice value="12" current={preferences.clock} label="AM/PM" onSelect={setClock} />
        <Choice value="24" current={preferences.clock} label="24-hour" onSelect={setClock} />
      </Row>
      <Row label="Units">
        <Choice value="metric" current={preferences.units} label="Metric" onSelect={setUnits} />
        <Choice value="imperial" current={preferences.units} label="Imperial" onSelect={setUnits} />
      </Row>
    </section>
  );
};
