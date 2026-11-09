import type { ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import type { ExploreClockStyle } from '@uaetrail/shared-types';
import {
  writeActiveDisplayPreferences,
  type ThemePreference,
  type UnitSystem,
} from '../../preferences/displayPreferences';
import { useDisplayPreferences } from '../../preferences/useDisplayPreferences';

const Choice = <T extends string>({
  value,
  current,
  label,
  onSelect,
  compact,
}: {
  value: T;
  current: T;
  label: string;
  onSelect: (value: T) => void;
  compact?: boolean;
}) => {
  const selected = value === current;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(value)}
      className={`${compact ? 'min-h-7 rounded-lg px-1.5 text-[12px]' : 'min-h-9 rounded-xl px-2 text-sm'} flex-1 font-semibold transition ${
        selected ? 'display-choice-on bg-white text-emerald-800 shadow-sm' : 'text-neutral-600'
      }`}
    >
      {label}
    </button>
  );
};

const Row = ({
  label,
  children,
  compact,
}: {
  label: string;
  children: ReactNode;
  compact?: boolean;
}) => (
  <div className={compact ? 'flex items-center gap-2 px-2.5 py-1.5' : 'flex items-center gap-3 px-4 py-3'}>
    <p
      className={
        compact
          ? 'w-16 shrink-0 text-[12px] font-semibold text-neutral-900'
          : 'w-24 shrink-0 text-sm font-semibold text-neutral-900'
      }
    >
      {label}
    </p>
    <div className={`flex min-w-0 flex-1 bg-neutral-100 p-0.5 ${compact ? 'rounded-xl' : 'rounded-2xl'}`}>
      {children}
    </div>
  </div>
);

const drawerThemeIconBtn = (selected: boolean) =>
  `inline-flex h-8 w-9 items-center justify-center rounded-lg transition ${
    selected ? 'bg-white text-emerald-800 shadow-sm' : 'text-neutral-500 active:text-neutral-700'
  }`;

const DrawerThemeIconToggle = ({
  current,
  onSelect,
}: {
  current: 'light' | 'dark';
  onSelect: (theme: ThemePreference) => void;
}) => (
  <div className="flex justify-end px-0.5 pb-0.5">
    <div className="inline-flex rounded-xl bg-neutral-100 p-0.5" role="group" aria-label="Theme">
      <button
        type="button"
        aria-pressed={current === 'light'}
        aria-label="Light theme"
        className={drawerThemeIconBtn(current === 'light')}
        onClick={() => onSelect('light')}
      >
        <Sun className="h-4 w-4" strokeWidth={2.25} aria-hidden />
      </button>
      <button
        type="button"
        aria-pressed={current === 'dark'}
        aria-label="Dark theme"
        className={drawerThemeIconBtn(current === 'dark')}
        onClick={() => onSelect('dark')}
      >
        <Moon className="h-4 w-4" strokeWidth={2.25} aria-hidden />
      </button>
    </div>
  </div>
);

type DisplayPreferencesSectionProps = {
  compact?: boolean;
  /** Hamburger drawer — light/dark only. */
  themeOnly?: boolean;
};

export const DisplayPreferencesSection = ({
  compact = false,
  themeOnly = false,
}: DisplayPreferencesSectionProps) => {
  const preferences = useDisplayPreferences();

  const setTheme = (theme: ThemePreference) => writeActiveDisplayPreferences({ theme });
  const setClock = (clock: ExploreClockStyle) => writeActiveDisplayPreferences({ clock });
  const setUnits = (units: UnitSystem) => writeActiveDisplayPreferences({ units });

  const themeCurrent: ThemePreference =
    themeOnly && preferences.theme === 'system' ? 'light' : preferences.theme;

  if (themeOnly && compact) {
    const iconCurrent: 'light' | 'dark' = themeCurrent === 'dark' ? 'dark' : 'light';
    return <DrawerThemeIconToggle current={iconCurrent} onSelect={setTheme} />;
  }

  return (
    <section
      className={
        compact
          ? undefined
          : 'overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm'
      }
    >
      {compact ? null : <h2 className="px-4 pb-1 pt-3 text-sm font-semibold text-neutral-500">Display</h2>}
      <Row label="Theme" compact={compact}>
        {!themeOnly ? (
          <Choice compact={compact} value="system" current={preferences.theme} label="System" onSelect={setTheme} />
        ) : null}
        <Choice compact={compact} value="light" current={themeCurrent} label="Light" onSelect={setTheme} />
        <Choice compact={compact} value="dark" current={themeCurrent} label="Dark" onSelect={setTheme} />
      </Row>
      {!themeOnly ? (
        <>
          <Row label="Time" compact={compact}>
            <Choice compact={compact} value="12" current={preferences.clock} label="AM/PM" onSelect={setClock} />
            <Choice compact={compact} value="24" current={preferences.clock} label="24-hour" onSelect={setClock} />
          </Row>
          <Row label="Units" compact={compact}>
            <Choice compact={compact} value="metric" current={preferences.units} label="Metric" onSelect={setUnits} />
            <Choice
              compact={compact}
              value="imperial"
              current={preferences.units}
              label="Imperial"
              onSelect={setUnits}
            />
          </Row>
        </>
      ) : null}
    </section>
  );
};
