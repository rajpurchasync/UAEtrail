import type { ProfileStamp } from '../../utils/profileStamps';
import { stampToneClass } from '../../utils/profileStamps';

interface ProfileStampsRowProps {
  stamps: ProfileStamp[];
  title?: string;
  compact?: boolean;
  align?: 'center' | 'start';
}

export const ProfileStampsRow = ({
  stamps,
  title = 'My Badges',
  compact = false,
  align = 'center',
}: ProfileStampsRowProps) => {
  if (stamps.length === 0) return null;

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      {title && (
        <p className={`font-bold uppercase tracking-wide text-neutral-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
          {title}
        </p>
      )}
      <div className={`flex flex-wrap gap-2 ${align === 'start' ? 'justify-start' : 'justify-center'}`}>
        {stamps.map((stamp) => (
          <span
            key={stamp.key}
            title={stamp.label}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
              stampToneClass[stamp.tone]
            }`}
          >
            <span aria-hidden>{stamp.emoji}</span>
            {stamp.label}
          </span>
        ))}
      </div>
    </div>
  );
};
