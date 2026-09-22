import { ChevronRight, HandHeart, MapPinned, Plus, X } from 'lucide-react';
import { EXPLORE_INTENT } from '../../config/exploreTheme';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';

export type ComposeIntentChoice = 'host' | 'request' | 'contribute';

interface MobileCreateIntentSheetProps {
  open: boolean;
  onClose: () => void;
  onChoose: (choice: ComposeIntentChoice) => void;
}

const INTENT_OPTIONS: Array<{
  key: ComposeIntentChoice;
  label: string;
  hint: string;
  icon: typeof Plus;
  iconWrap: string;
  card: string;
  titleClass: string;
}> = [
  {
    key: 'host',
    label: 'Host',
    hint: 'Post a hike, camp, or outing for others to join',
    icon: Plus,
    iconWrap: EXPLORE_INTENT.host.iconWrap,
    card: EXPLORE_INTENT.host.card,
    titleClass: EXPLORE_INTENT.host.label,
  },
  {
    key: 'request',
    label: 'Find a group',
    hint: 'Say what you want to do and match with others',
    icon: HandHeart,
    iconWrap: EXPLORE_INTENT.request.iconWrap,
    card: EXPLORE_INTENT.request.card,
    titleClass: EXPLORE_INTENT.request.label,
  },
  {
    key: 'contribute',
    label: 'Add a place',
    hint: 'Trails, camps, shops, and venues on the map',
    icon: MapPinned,
    iconWrap: EXPLORE_INTENT.contribute.iconWrap,
    card: EXPLORE_INTENT.contribute.card,
    titleClass: EXPLORE_INTENT.contribute.label,
  },
];

export const MobileCreateIntentSheet = ({ open, onClose, onChoose }: MobileCreateIntentSheetProps) => (
  <ExploreResponsiveSheet
    open={open}
    onClose={onClose}
    maxWidthClass="lg:max-w-md"
    panelClassName="px-4 pb-[calc(var(--safe-bottom)+4.5rem)] pt-1 lg:px-6 lg:pb-6 lg:pt-2"
  >
    <div className="relative mb-3 flex items-center justify-between gap-3 lg:mb-4">
      <h2 className="text-base font-bold tracking-tight text-neutral-900 lg:text-xl">
        <span className="lg:hidden">Create</span>
        <span className="hidden lg:inline">What would you like to do?</span>
      </h2>
      <button
        type="button"
        onClick={onClose}
        className="-mr-1 rounded-full p-2 text-neutral-400 hover:bg-neutral-100"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>
    </div>

    <p className="mb-3 hidden text-sm leading-snug text-neutral-500 lg:block">
      Host something, ask the community to join you, or add a venue to the map.
    </p>

    <div className="space-y-2 lg:space-y-3">
      {INTENT_OPTIONS.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChoose(option.key)}
            className={`flex w-full items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left transition lg:gap-4 lg:px-4 lg:py-4 ${option.card}`}
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl lg:h-14 lg:w-14 lg:rounded-2xl ${option.iconWrap}`}
            >
              <Icon className="h-5 w-5 lg:h-7 lg:w-7" strokeWidth={2.25} />
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[15px] font-semibold lg:text-lg lg:font-bold ${option.titleClass}`}>
                {option.label}
              </span>
              <span className="mt-0.5 hidden text-sm leading-snug text-neutral-600 lg:block">{option.hint}</span>
            </span>
            <ChevronRight className="hidden h-5 w-5 shrink-0 text-neutral-300 lg:block" aria-hidden />
          </button>
        );
      })}
    </div>
  </ExploreResponsiveSheet>
);
