import type { MemberProfilePresentationMode } from '../../member/memberProfilePresentation';

export const MemberProfilePresentationSwitch = ({
  mode,
  onChange,
}: {
  mode: MemberProfilePresentationMode;
  onChange: (next: MemberProfilePresentationMode) => void;
}) => (
  <div
    className="flex rounded-xl border border-neutral-200/90 bg-neutral-50/90 p-1 dark:border-neutral-700 dark:bg-neutral-900/80"
    role="tablist"
    aria-label="Profile view"
  >
    <button
      type="button"
      role="tab"
      aria-selected={mode === 'social'}
      onClick={() => onChange('social')}
      className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
        mode === 'social'
          ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-50'
          : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
      }`}
    >
      Member
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={mode === 'host'}
      onClick={() => onChange('host')}
      className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
        mode === 'host'
          ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-50'
          : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400'
      }`}
    >
      Host
    </button>
  </div>
);
