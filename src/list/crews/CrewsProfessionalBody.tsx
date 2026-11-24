import type { ExploreMapItemDTO, MemberBrowseCardDTO } from '@uaetrail/shared-types';
import type { CrewProfessionalKind } from '@/crew-discovery/crewBrowseState';
import {
  crewsProfessionalShowsAgencies,
  crewsProfessionalShowsGuides,
  filterCrewsProfessionalDirectory,
} from './crewsProfessionalFilters';
import { EXPLORE_CREWS_CONNECT_EMPTY } from '@/content/exploreCrewsCopy';
import { BrowseListSectionHeader } from '@/list/browse/BrowseListSectionHeader';
import { CrewsGuidesRail } from './CrewsGuidesRail';
import { CrewsProfessionalAgenciesList } from './CrewsProfessionalAgenciesList';

type Props = {
  isSignedIn?: boolean;
  directory: MemberBrowseCardDTO[];
  discoveryLoading: boolean;
  agencyItems: ExploreMapItemDTO[];
  exploreCatalogItems: ExploreMapItemDTO[];
  exploreCatalogLoading: boolean;
  onOpenAgencyItem: (item: ExploreMapItemDTO) => void;
  professionalKind: CrewProfessionalKind;
};

export const CrewsProfessionalBody = ({
  isSignedIn = true,
  directory,
  discoveryLoading,
  agencyItems,
  exploreCatalogItems,
  exploreCatalogLoading,
  onOpenAgencyItem,
  professionalKind,
}: Props) => {
  const guides = filterCrewsProfessionalDirectory(directory, professionalKind);
  const showGuides = crewsProfessionalShowsGuides(professionalKind);
  const showAgencies = crewsProfessionalShowsAgencies(professionalKind);
  if (discoveryLoading) {
    return <p className="text-sm text-neutral-500">Loading professionals…</p>;
  }
  return (
    <div className="space-y-8">
      {showGuides ? (
        <section className="space-y-2">
          <BrowseListSectionHeader label="Guides &amp; porters" />
          <p className="text-sm text-neutral-600">Verified outdoor pros you can message from their profile.</p>
          {guides.length > 0 ? (
            <CrewsGuidesRail guides={guides} isSignedIn={isSignedIn} />
          ) : (
            <p className="text-sm text-neutral-500">{EXPLORE_CREWS_CONNECT_EMPTY}</p>
          )}
        </section>
      ) : null}
      {showAgencies ? (
        <section className="space-y-2">
          <BrowseListSectionHeader label="Tour operators &amp; agencies" />
          <p className="text-sm text-neutral-600">Licensed operators and experience businesses on the map.</p>
          <CrewsProfessionalAgenciesList
              agencyItems={agencyItems}
              exploreCatalogItems={exploreCatalogItems}
              loading={exploreCatalogLoading}
              onOpenAgencyItem={onOpenAgencyItem}
            />
        </section>
      ) : null}
    </div>
  );
};