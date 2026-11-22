import type { ExploreMapItemDTO, MemberBrowseCardDTO } from '@uaetrail/shared-types';
import { EXPLORE_CREWS_CONNECT_EMPTY } from '@/content/exploreCrewsCopy';
import { CrewsGuidesRail } from './CrewsGuidesRail';
import { filterCrewsGuideDirectoryCards } from './crewsGuides';
import { CrewsProfessionalAgenciesList } from './CrewsProfessionalAgenciesList';

type Props = {
  directory: MemberBrowseCardDTO[];
  discoveryLoading: boolean;
  agencyItems: ExploreMapItemDTO[];
  exploreCatalogItems: ExploreMapItemDTO[];
  exploreCatalogLoading: boolean;
  onOpenAgencyItem: (item: ExploreMapItemDTO) => void;
};

export const CrewsProfessionalBody = ({
  directory,
  discoveryLoading,
  agencyItems,
  exploreCatalogItems,
  exploreCatalogLoading,
  onOpenAgencyItem,
}: Props) => {
  const guides = filterCrewsGuideDirectoryCards(directory);
  if (discoveryLoading) {
    return <p className="text-sm text-neutral-500">Loading professionals…</p>;
  }
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-base font-semibold text-neutral-900">Guides &amp; porters</h2>
        <p className="mt-1 text-sm text-neutral-600">Verified outdoor pros you can message from their profile.</p>
        {guides.length > 0 ? (
          <div className="mt-3">
            <CrewsGuidesRail guides={guides} />
          </div>
        ) : (
          <p className="mt-3 text-sm text-neutral-500">{EXPLORE_CREWS_CONNECT_EMPTY}</p>
        )}
      </section>
      <section>
        <h2 className="text-base font-semibold text-neutral-900">Tour operators &amp; agencies</h2>
        <p className="mt-1 text-sm text-neutral-600">Licensed operators and experience businesses on the map.</p>
        <div className="mt-3">
          <CrewsProfessionalAgenciesList
            agencyItems={agencyItems}
            exploreCatalogItems={exploreCatalogItems}
            loading={exploreCatalogLoading}
            onOpenAgencyItem={onOpenAgencyItem}
          />
        </div>
      </section>
    </div>
  );
};