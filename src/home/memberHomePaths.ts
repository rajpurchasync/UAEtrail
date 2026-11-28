import { venuesMapHomePath } from '../config/mobileFiveTabNav';
import {
  findCrewCommunityDiscoveryPath,
  findCrewDiscoveryListPath,
  listDiscoveryPath,
  tripsListHomePath,
  venuesListHomePath,
} from '../list/browse/browseListRouting';

export const memberHomeFindPlacesPath = (): string => venuesMapHomePath();

export const memberHomeFindCompanyPath = (): string => findCrewDiscoveryListPath();

export const memberHomeHireProfessionalsPath = (): string =>
  listDiscoveryPath({
    listCat: 'people',
    categories: ['people'],
    crewPeopleSurface: 'find',
    crewBrowseLane: 'professional',
    crewProfessionalKind: 'guide',
  });

export const memberHomeTripsSeeAllPath = (): string => tripsListHomePath();

export const memberHomeCommunitySeeAllPath = (): string => findCrewCommunityDiscoveryPath();

export const memberHomeDealsSeeAllPath = (): string => venuesListHomePath();
