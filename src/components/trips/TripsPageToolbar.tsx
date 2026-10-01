import { TabPageSearchRow } from '../mobile/TabPageSearchRow';
import { TripsMainTabs } from './TripsMainTabs';
import { TripsSubviewPills } from './TripsSubviewPills';
import { TripsFilterTrigger } from './TripsFiltersSheet';
import { tripsHistoryRoleChips, type TripsMainView, type TripsRole } from '../../trips/tripsRouting';

type TripsPageToolbarProps = {
  mainView: TripsMainView;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filtersActive: boolean;
  onOpenFilters: () => void;
  historyRole: TripsRole;
  onHistoryRoleChange: (role: TripsRole) => void;
  canHost: boolean;
};

export const TripsPageToolbar = ({
  mainView,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  filtersActive,
  onOpenFilters,
  historyRole,
  onHistoryRoleChange,
  canHost,
}: TripsPageToolbarProps) => (
  <div className="flex flex-col gap-3">
    <TripsMainTabs active={mainView} />

    {mainView === 'completed' ? (
      <TabPageSearchRow
        inset
        mobileSearch="field"
        value={searchQuery}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        beforeAction={<TripsFilterTrigger active={filtersActive} onClick={onOpenFilters} />}
      />
    ) : null}

    {mainView === 'completed' ? (
      <TripsSubviewPills
        pills={tripsHistoryRoleChips(canHost)}
        activeId={historyRole}
        onChange={onHistoryRoleChange}
      />
    ) : null}
  </div>
);
