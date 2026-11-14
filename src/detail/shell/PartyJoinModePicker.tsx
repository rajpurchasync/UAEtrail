import type { PartyJoinMode } from '../partyJoinIntent';
import {
  GROUP_JOIN_MODE_HEADCOUNT,
  GROUP_JOIN_MODE_ME,
  GROUP_JOIN_MODE_TEAM,
} from '../../content/groupJoinCopy';

const pillClass = (active: boolean) =>
  `rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
    active
      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100'
      : 'border-neutral-200 bg-white text-neutral-700 hover:border-emerald-200 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200'
  }`;

type PartyJoinModePickerProps = {
  mode: PartyJoinMode;
  onChange: (mode: PartyJoinMode) => void;
  teamAvailable?: boolean;
};

export const PartyJoinModePicker = ({ mode, onChange, teamAvailable = true }: PartyJoinModePickerProps) => (
  <div className="space-y-1.5">
    <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">Who&apos;s joining?</p>
    <div className="flex flex-wrap gap-2">
      <button type="button" className={pillClass(mode === 'me')} onClick={() => onChange('me')}>
        {GROUP_JOIN_MODE_ME}
      </button>
      <button type="button" className={pillClass(mode === 'headcount')} onClick={() => onChange('headcount')}>
        {GROUP_JOIN_MODE_HEADCOUNT}
      </button>
      {teamAvailable ? (
        <button type="button" className={pillClass(mode === 'team')} onClick={() => onChange('team')}>
          {GROUP_JOIN_MODE_TEAM}
        </button>
      ) : null}
    </div>
  </div>
);