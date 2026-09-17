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
  title: string;
  subtitle: string;
  icon: typeof Plus;
  iconWrap: string;
  card: string;
  label: string;
}> = [
  {
    key: 'host',
    title: 'I am hosting',
    subtitle: 'Post a hike, camp, rideshare, or outdoor plan for others to join',
    icon: Plus,
    ...EXPLORE_INTENT.host,
  },
  {
    key: 'request',
    title: 'I want to go',
    subtitle: 'Tell the community what you are looking for and find a match',
    icon: HandHeart,
    ...EXPLORE_INTENT.request,
  },
  {
    key: 'contribute',
    title: 'Contribute',
    subtitle: 'Add trails, camps, shops, and outdoor venues to the map',
    icon: MapPinned,
    ...EXPLORE_INTENT.contribute,
  },
];

export const MobileCreateIntentSheet = ({ open, onClose, onChoose }: MobileCreateIntentSheetProps) => {
  return (
    <ExploreResponsiveSheet
      open={open}
      onClose={onClose}
      maxWidthClass="lg:max-w-md"
      panelClassName="px-5 pb-[calc(var(--safe-bottom)+4.5rem)] pt-1 lg:px-6 lg:pb-6 lg:pt-2"
    >
      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 pr-8">
          <h2 className="text-lg font-bold tracking-tight text-gray-900 lg:text-xl">What would you like to do?</h2>
          <p className="mt-1 text-sm leading-snug text-gray-500">
            Host something, ask the community to join you, or add a venue to the map.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-0 top-0 rounded-full p-2 text-gray-400 hover:bg-neutral-100"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-3">
        {INTENT_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onChoose(option.key)}
              className={`flex w-full items-center gap-4 rounded-2xl border-2 px-4 py-4 text-left transition ${option.card}`}
            >
              <span
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${option.iconWrap}`}
              >
                <Icon className="h-7 w-7" strokeWidth={2.25} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-lg font-bold ${option.label}`}>{option.title}</span>
                <span className="mt-0.5 block text-sm leading-snug text-gray-600">{option.subtitle}</span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" aria-hidden />
            </button>
          );
        })}
      </div>
    </ExploreResponsiveSheet>
  );
};
