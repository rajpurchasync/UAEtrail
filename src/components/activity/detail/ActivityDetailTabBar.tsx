import { CalendarDays, Car, MapPin, Users } from 'lucide-react';
import type { ActivityDetailTabId } from '../../../activity/activityDetailTab';
import { ACTIVITY_DETAIL_TABS, ACTIVITY_DETAIL_TAB_LABELS } from '../../../activity/activityDetailTab';
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
  /** Omit Transport when the outing has no rideshare / linked transport content. */
  showTransportTab?: boolean;
};

/** Mobile-first icon tabs for activity detail. */
export const ActivityDetailTabBar = ({
  active,
  onChange,
  showTransportTab = true,
}: ActivityDetailTabBarProps) => {
  const tabIds = showTransportTab
    ? ACTIVITY_DETAIL_TABS
    : ACTIVITY_DETAIL_TABS.filter((tab) => tab !== 'transport');

  const tabs = tabIds.map((id) => ({
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
