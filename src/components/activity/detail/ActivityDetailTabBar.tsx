import { CalendarDays, Car, MapPin, Users } from 'lucide-react';
import type { ActivityDetailTabId } from '../../../activity/activityDetailTab';
import { ACTIVITY_DETAIL_TAB_LABELS } from '../../../activity/activityDetailTab';
import { ConsumerEntityTabBar } from '../../mobile/ConsumerEntityTabBar';

const TAB_ICONS: Record<ActivityDetailTabId, typeof CalendarDays> = {
  plan: CalendarDays,
  place: MapPin,
  buddies: Users,
  transport: Car,
};

type ActivityDetailTabBarProps = {
  active: ActivityDetailTabId;
  onChange: (tab: ActivityDetailTabId) => void;
  /** Kind template + wire — authoritative tab list for mobile chrome. */
  visibleTabs: ActivityDetailTabId[];
};

/** Mobile-first icon tabs for activity detail. */
export const ActivityDetailTabBar = ({
  active,
  onChange,
  visibleTabs,
}: ActivityDetailTabBarProps) => {
  const tabs = visibleTabs.map((id) => ({
    id,
    label: ACTIVITY_DETAIL_TAB_LABELS[id],
    icon: TAB_ICONS[id],
  }));

  return (
    <ConsumerEntityTabBar
      tabs={tabs}
      active={active}
      onChange={onChange}
      ariaLabel="Activity sections"
      stickyTopClassName="top-[52px]"
    />
  );
};
