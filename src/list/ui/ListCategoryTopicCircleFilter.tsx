import { DEMAND_EMOJI } from '../../explore/exploreCopy';
import { ExploreFilterIcon } from '../../explore/ui/ExploreFilterIcon';
import { LIST_CHIP_SCROLL } from '../listChromeTheme';
import type { ListCategoryPill } from '../listCategoryFilterPills';

const TopicEmoji = ({ pill }: { pill: ListCategoryPill }) => {
  if (pill.id === 'topic-looking') {
    return (
      <span className="font-emoji text-[1.35rem] leading-none sm:text-[1.45rem]" aria-hidden>
        {DEMAND_EMOJI}
      </span>
    );
  }
  if (pill.filterKey) {
    return (
      <ExploreFilterIcon
        filter={pill.filterKey}
        context="activity"
        className="text-[1.35rem] leading-none sm:text-[1.45rem]"
      />
    );
  }
  return null;
};

const emojiRingClass = (active: boolean) =>
  [
    'inline-flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
    active ? 'border-neutral-900' : 'border-neutral-200',
  ].join(' ');

const topicButtonClass = (active: boolean) =>
  [
    'flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-1 py-1.5',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300/80',
    active ? '' : 'active:opacity-90',
  ].join(' ');

const topicLabelClass = (active: boolean) =>
  [
    'w-full text-center text-[11px] font-semibold leading-snug sm:text-xs',
    active ? 'text-neutral-900' : 'text-neutral-600',
  ].join(' ');

const gridColsClass = (count: number): string => {
  if (count <= 2) return 'grid-cols-2';
  if (count === 3) return 'grid-cols-3';
  return 'grid-cols-4';
};

interface ListCategoryTopicCircleFilterProps {
  pills: ListCategoryPill[];
  /** Leave room for floating filter affordance on the right. */
  reserveFilterSpace?: boolean;
}

/** Trips category — tight outline ring around emoji + label (no fill). */
export const ListCategoryTopicCircleFilter = ({
  pills,
  reserveFilterSpace = false,
}: ListCategoryTopicCircleFilterProps) => {
  const useGrid = reserveFilterSpace || pills.length <= 4;

  if (useGrid) {
    return (
      <div
        className={`grid w-full min-w-0 ${gridColsClass(pills.length)} gap-x-1 gap-y-1 ${
          reserveFilterSpace ? 'pr-[3.25rem]' : ''
        }`}
      >
        {pills.map((pill) => (
          <button
            key={pill.id}
            type="button"
            onClick={pill.onToggle}
            className={topicButtonClass(pill.active)}
            aria-pressed={pill.active}
            aria-label={pill.label}
          >
            <span className={emojiRingClass(pill.active)}>
              <TopicEmoji pill={pill} />
            </span>
            <span className={topicLabelClass(pill.active)}>{pill.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`min-w-0 flex-1 ${LIST_CHIP_SCROLL} gap-2 pb-0.5 pt-0.5`}>
      {pills.map((pill) => (
        <button
          key={pill.id}
          type="button"
          onClick={pill.onToggle}
          className={`${topicButtonClass(pill.active)} w-[4.25rem] shrink-0 snap-start`}
          aria-pressed={pill.active}
          aria-label={pill.label}
        >
          <span className={emojiRingClass(pill.active)}>
            <TopicEmoji pill={pill} />
          </span>
          <span className={topicLabelClass(pill.active)}>{pill.label}</span>
        </button>
      ))}
    </div>
  );
};
