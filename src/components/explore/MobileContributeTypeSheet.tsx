import { ChevronLeft, ChevronRight, Mountain, ShoppingBag, Sparkles, Tent, X } from 'lucide-react';
import type { ActivityType } from '../../config/activityTypes';
import { ExploreResponsiveSheet } from './ExploreResponsiveSheet';

export type ContributeVenueKind = ActivityType | 'shop';

interface MobileContributeTypeSheetProps {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  onChoose: (kind: ContributeVenueKind) => void;
}

const CONTRIBUTE_OPTIONS: Array<{
  key: ContributeVenueKind;
  title: string;
  subtitle: string;
  icon: typeof Mountain;
  tone: string;
  iconWrap: string;
}> = [
  {
    key: 'hiking',
    title: 'Hiking Trails',
    subtitle: 'Trails and day-hike spots',
    icon: Mountain,
    tone: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
    iconWrap: 'bg-emerald-600 text-white',
  },
  {
    key: 'camping',
    title: 'Camping Spots',
    subtitle: 'Campgrounds and overnight spots',
    icon: Tent,
    tone: 'border-amber-200 bg-gradient-to-br from-amber-50 to-white',
    iconWrap: 'bg-amber-600 text-white',
  },
  {
    key: 'shop',
    title: 'Outdoor shops',
    subtitle: 'Gear shops and outfitters on the map',
    icon: ShoppingBag,
    tone: 'border-violet-200 bg-gradient-to-br from-violet-50 to-white',
    iconWrap: 'bg-violet-600 text-white',
  },
  {
    key: 'event',
    title: 'Others',
    subtitle: 'Runs, beaches, parks, and outdoor places',
    icon: Sparkles,
    tone: 'border-sky-200 bg-gradient-to-br from-sky-50 to-white',
    iconWrap: 'bg-sky-600 text-white',
  },
];

export const MobileContributeTypeSheet = ({ open, onClose, onBack, onChoose }: MobileContributeTypeSheetProps) => {
  if (!open) return null;

  return (
    <ExploreResponsiveSheet
      open
      onClose={onClose}
      maxWidthClass="lg:max-w-md"
      panelClassName="px-5 pb-[calc(var(--safe-bottom)+4.5rem)] pt-1 lg:px-6 lg:pb-6 lg:pt-2"
    >
      <div className="relative mb-4">
        <div className="mb-3 flex items-center justify-between">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-0.5 text-sm font-semibold text-gray-700"
            >
              <ChevronLeft className="h-5 w-5" />
              Back
            </button>
          ) : (
            <span className="w-14" />
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-500 hover:bg-neutral-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-w-0 pr-2">
          <h2 className="text-lg font-bold tracking-tight text-gray-900 lg:text-xl">Contribute to the community</h2>
          <p className="mt-1 text-sm leading-snug text-gray-500">
            Hiking Trails, Camping Spots, Outdoor shops, Others
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CONTRIBUTE_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onChoose(option.key)}
              className={`flex flex-col rounded-2xl border-2 px-3 py-4 text-left transition ${option.tone}`}
            >
              <span className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${option.iconWrap}`}>
                <Icon className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <span className="block text-sm font-bold text-gray-900">{option.title}</span>
              <span className="mt-1 block text-xs leading-snug text-gray-600">{option.subtitle}</span>
              <ChevronRight className="mt-2 h-4 w-4 text-gray-300" aria-hidden />
            </button>
          );
        })}
      </div>
    </ExploreResponsiveSheet>
  );
};
