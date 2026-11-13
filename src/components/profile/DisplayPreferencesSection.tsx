import type { ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import { writeActiveDisplayPreferences, type ThemePreference } from '../../preferences/displayPreferences';
import { useDisplayPreferences } from '../../preferences/useDisplayPreferences';

const Choice = ({
  value,
  current,
  label,
  onSelect,
  compact,
}: {
  value: 'light' | 'dark';
  current: 'light' | 'dark';
  label: string;
  onSelect: (value: 'light' | 'dark') => void;
  compact?: boolean;
}) => {
  const selected = value === current;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(value)}
      className={`${compact ? 'min-h-7 rounded-lg px-1.5 text-[12px]' : 'min-h-9 rounded-xl px-2 text-sm'} min-w-0 flex-1 truncate font-semibold transition ${
        selected
          ? 'display-choice-on bg-white text-emerald-800 shadow-sm dark:bg-emerald-700 dark:text-white'
          : 'text-neutral-600 dark:text-neutral-300'
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
  <div className={compact ? 'flex items-center gap-2 px-2.5 py-1.5' : 'flex items-center gap-3 px-4 py-3 sm:gap-4'}>
    <p
      className={
        compact
          ? 'w-16 shrink-0 text-[12px] font-semibold text-neutral-900 dark:text-neutral-50'
          : 'w-24 shrink-0 text-sm font-semibold text-neutral-900 dark:text-neutral-50'
      }
    >
      {label}
    </p>
    <div className={`flex min-w-[12.5rem] flex-1 bg-neutral-100 p-0.5 dark:bg-neutral-800 ${compact ? 'rounded-xl' : 'rounded-2xl'}`}>
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

const resolveUiTheme = (theme: ThemePreference): 'light' | 'dark' => (theme === 'dark' ? 'dark' : 'light');

export const DisplayPreferencesSection = ({
  compact = false,
  themeOnly = false,
}: DisplayPreferencesSectionProps) => {
  const preferences = useDisplayPreferences();
  const themeCurrent = resolveUiTheme(preferences.theme);

  const setTheme = (theme: 'light' | 'dark') => writeActiveDisplayPreferences({ theme });

  if (themeOnly && compact) {
    return <DrawerThemeIconToggle current={themeCurrent} onSelect={setTheme} />;
  }

  return (
    <section
      className={
        compact
          ? undefined
          : 'overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900'
      }
    >
      {compact ? null : <h2 className="px-4 pb-1 pt-3 text-sm font-semibold text-neutral-500">Display</h2>}
      <Row label="Theme" compact={compact}>
        <Choice compact={compact} value="light" current={themeCurrent} label="Light" onSelect={setTheme} />
        <Choice compact={compact} value="dark" current={themeCurrent} label="Dark" onSelect={setTheme} />
      </Row>
    </section>
  );
};
