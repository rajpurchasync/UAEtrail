/**
 * B-UNIFY-06 — canonical discovery experience orchestration entrypoints.
 * Map-first shell and list projection keep surface-specific composition; consumers import from here.
 */
export {
  useExploreExperienceModel as useDiscoveryMapExperienceModel,
  useExploreExperienceModel,
} from '../explore/shell/useExploreExperienceModel';

export {
  useListDiscoveryExperienceModel as useDiscoveryListExperienceModel,
  useListDiscoveryExperienceModel,
  type ListDiscoveryExperienceProps as DiscoveryListExperienceProps,
} from '../list/shell/useListDiscoveryExperienceModel';