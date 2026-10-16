import { TabPageSearchRow } from '../mobile/TabPageSearchRow';
import { ProfileHistoryMainTabs } from './ProfileHistoryMainTabs';
import { ProfileHistorySubviewPills } from './ProfileHistorySubviewPills';
import { ProfileHistoryFilterTrigger } from './ProfileHistoryFiltersSheet';
import { tripsHistoryRoleChips, type TripsMainView, type TripsRole } from '../../member-plan/tripsRouting';

type ProfileHistoryPageToolbarProps = {
  surface: 'plan' | 'history';
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

export const ProfileHistoryPageToolbar = ({
  surface,
  mainView,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  filtersActive,
  onOpenFilters,
  historyRole,
  onHistoryRoleChange,
  canHost,
}: ProfileHistoryPageToolbarProps) => (
  <div className="flex flex-col gap-3">
    {surface === 'history' ? <ProfileHistoryMainTabs active={mainView} /> : null}

    {mainView === 'completed' ? (
      <TabPageSearchRow
        inset
        mobileSearch="field"
        value={searchQuery}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        beforeAction={
          <ProfileHistoryFilterTrigger
            active={filtersActive}
            onClick={onOpenFilters}
            aria-label="More filters"
          />
        }
      />
    ) : null}

    {mainView === 'completed' ? (
      <ProfileHistorySubviewPills
        pills={tripsHistoryRoleChips(canHost)}
        activeId={historyRole}
        onChange={onHistoryRoleChange}
      />
    ) : null}
  </div>
);
