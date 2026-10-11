import type { ActivityDetailHeroStatusChip } from '../../../activity/activityDetailHeroStatus';

const toneClass: Record<ActivityDetailHeroStatusChip['tone'], string> = {
  neutral: 'bg-neutral-100 text-neutral-800',
  success: 'bg-emerald-100 text-emerald-900',
  warning: 'bg-amber-100 text-amber-900',
  muted: 'bg-neutral-100 text-neutral-500',
};

type ActivityDetailHeroStatusStripProps = {
  chips: ActivityDetailHeroStatusChip[];
};

export const ActivityDetailHeroStatusStrip = ({ chips }: ActivityDetailHeroStatusStripProps) => {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClass[chip.tone]}`}
        >
          {chip.label}
        </span>
      ))}
    </div>
  );
};
