import type {
  ExploreAvailablePersonDTO,
  ExploreMapItemDTO,
  MemberBrowseCardDTO,
  MemberDiscoveryQuotaDTO,
  SocialPersonRowDTO,
} from '@uaetrail/shared-types';
import type { PeopleBrowseTab } from '@/people-discovery/peopleBrowseTab';
import { PeopleBrowseTabContent } from '@/people-discovery/panel/peopleBrowse';
import { CrewsHubHome } from './CrewsHubHome';
import { CrewsAvailableSubChips } from './CrewsAvailableSubChips';
import { CrewsGuidesRail } from './CrewsGuidesRail';
import { filterCrewsGuideDirectoryCards } from './crewsGuides';
import type { CrewsStatTab } from './crewsStatTab';
import type { CrewsAvailableOpenLens } from './crewsOpenSegment';

type CrewsTabBodyProps = {
  segment: PeopleBrowseTab;
  crewsOpenLens: CrewsAvailableOpenLens;
  onCrewsOpenLensChange: (lens: CrewsAvailableOpenLens) => void;
  onSelectStatTab: (tab: CrewsStatTab) => void;
  onBrowseGuides: () => void;
  buddiesCount: number;
  availableCount: number;
  everyoneCount: number;
  isSignedIn: boolean;
  availabilityPeople: ExploreAvailablePersonDTO[];
  availabilityLoading: boolean;
  availabilityError: string | null;
  friendsGoing: SocialPersonRowDTO[];
  hostsGoing: SocialPersonRowDTO[];
  directory: MemberBrowseCardDTO[];
  discoveryQuota: MemberDiscoveryQuotaDTO | null;
  discoveryLoading: boolean;
  discoveryError: string | null;
  seekingActivities: ExploreMapItemDTO[];
  exploreCatalogItems: ExploreMapItemDTO[];
  exploreCatalogLoading: boolean;
  onOpenSeekingActivity: (item: ExploreMapItemDTO) => void;
  onOpenAvailability: () => void;
  buddyUserIds?: Set<string>;
};

export const CrewsTabBody = ({
  segment,
  crewsOpenLens,
  onCrewsOpenLensChange,
  onSelectStatTab,
  onBrowseGuides,
  buddiesCount,
  availableCount,
  everyoneCount,
  isSignedIn,
  availabilityPeople,
  availabilityLoading,
  availabilityError,
  friendsGoing,
  hostsGoing,
  directory,
  discoveryQuota,
  discoveryLoading,
  discoveryError,
  seekingActivities,
  exploreCatalogItems,
  exploreCatalogLoading,
  onOpenSeekingActivity,
  onOpenAvailability,
  buddyUserIds,
}: CrewsTabBodyProps) => {
  if (segment === 'hub') {
    return (
      <CrewsHubHome
        directory={directory}
        buddiesCount={buddiesCount}
        availableCount={availableCount}
        everyoneCount={everyoneCount}
        onSelectTab={onSelectStatTab}
        isSignedIn={isSignedIn}
      />
    );
  }

  const showGuidesEscape = segment === 'connect';
  const guides = filterCrewsGuideDirectoryCards(directory);

  const isAvailableLane = segment === 'available' || segment === 'looking';
  const effectiveLens: CrewsAvailableOpenLens =
    segment === 'looking' && crewsOpenLens === 'all' ? 'looking' : crewsOpenLens;

  return (
    <>
      {showGuidesEscape && guides.length > 0 ? (
        <div className="mb-4">
          <CrewsGuidesRail guides={guides} />
          <button
            type="button"
            className="mt-2 text-sm font-semibold text-emerald-700"
            onClick={onBrowseGuides}
          >
            Browse guides on hub
          </button>
        </div>
      ) : null}
      {isAvailableLane ? (
        <CrewsAvailableSubChips lens={effectiveLens} onLensChange={onCrewsOpenLensChange} />
      ) : null}
      <PeopleBrowseTabContent
        tab={segment === 'looking' ? 'available' : segment}
        crewsOpenLens={isAvailableLane ? effectiveLens : undefined}
        isSignedIn={isSignedIn}
        seekingActivities={seekingActivities}
        exploreCatalogItems={exploreCatalogItems}
        exploreCatalogLoading={exploreCatalogLoading}
        onOpenSeekingActivity={onOpenSeekingActivity}
        buddyUserIds={buddyUserIds}
        availabilityPeople={availabilityPeople}
        availabilityLoading={availabilityLoading}
        availabilityError={availabilityError}
        friendsGoing={friendsGoing}
        hostsGoing={hostsGoing}
        directory={directory}
        discoveryQuota={discoveryQuota}
        discoveryLoading={discoveryLoading}
        discoveryError={discoveryError}
        onOpenAvailability={onOpenAvailability}
      />
    </>
  );
};