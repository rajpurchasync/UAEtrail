import { CalendarDays, Car, MapPin, Users } from 'lucide-react';
import type { ActivityDetailTabId } from '../../../activity/activityDetailTab';
import { ACTIVITY_DETAIL_TABS, ACTIVITY_DETAIL_TAB_LABELS } from '../../../activity/activityDetailTab';

const TAB_ICONS: Record<ActivityDetailTabId, typeof CalendarDays> = {
  plan: CalendarDays,
  place: MapPin,
  buddies: Users,
  transport: Car,
};

type ActivityDetailTabBarProps = {
  active: ActivityDetailTabId;
  onChange: (tab: ActivityDetailTabId) => void;
  /** Omit Transport when the outing has no rideshare / linked transport content. */
  showTransportTab?: boolean;
};

/** Mobile-first icon tabs for activity detail. */
export const ActivityDetailTabBar = ({
  active,
  onChange,
  showTransportTab = true,
}: ActivityDetailTabBarProps) => {
  const tabs = showTransportTab
    ? ACTIVITY_DETAIL_TABS
    : ACTIVITY_DETAIL_TABS.filter((tab) => tab !== 'transport');

  return (
  <div
    className="md:hidden flex border-b border-neutral-200/80 bg-white/90 backdrop-blur-sm sticky top-[52px] z-20"
    role="tablist"
    aria-label="Activity sections"
  >
    {tabs.map((tab) => {
      const selected = tab === active;
      const Icon = TAB_ICONS[tab];
      const label = ACTIVITY_DETAIL_TAB_LABELS[tab];
      return (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={selected}
          aria-label={label}
          title={label}
          onClick={() => onChange(tab)}
          className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
            selected ? 'text-emerald-800' : 'text-neutral-500'
          }`}
        >
          <Icon className="h-5 w-5" strokeWidth={selected ? 2.25 : 2} aria-hidden />
          <span className="sr-only">{label}</span>
          {selected ? (
            <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-emerald-600" aria-hidden />
          ) : null}
        </button>
      );
    })}
  </div>
  );
};
