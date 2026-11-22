import type { MemberBrowseCardDTO } from '@uaetrail/shared-types';
import type { CrewProfessionalKind } from '@/crew-discovery/crewBrowseState';
import { filterCrewsGuideDirectoryCards } from './crewsGuides';

export const crewsProfessionalShowsGuides = (kind: CrewProfessionalKind): boolean =>
  kind === 'all' || kind === 'guide' || kind === 'porter';

export const crewsProfessionalShowsAgencies = (kind: CrewProfessionalKind): boolean =>
  kind === 'all' || kind === 'agency';

export const filterCrewsProfessionalDirectory = (
  directory: MemberBrowseCardDTO[],
  kind: CrewProfessionalKind
): MemberBrowseCardDTO[] => {
  const guides = filterCrewsGuideDirectoryCards(directory);
  if (kind === 'agency') return [];
  if (kind === 'guide') {
    return guides.filter((row) => row.profileRoleLabel === 'professional_guide');
  }
  if (kind === 'porter') {
    return guides.filter((row) => row.profileRoleLabel === 'professional_guide');
  }
  return guides;
};