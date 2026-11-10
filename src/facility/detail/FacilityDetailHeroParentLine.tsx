import { GeoGuestDrillLink } from '../../geo/GeoGuestDrillLink';

const HERO_PARENT_LINK_CLASS =
  'underline decoration-white/40 underline-offset-[3px] hover:text-white';

/** Facility hero — link to the parent trail / camp when scoped via {@link FacilityDTO.parentPlaceId}. */
export const FacilityDetailHeroParentLine = ({
  parentPlaceName,
  parentPlacePath,
  linkState,
}: {
  parentPlaceName: string;
  parentPlacePath: string;
  linkState?: object;
}) => (
  <p className="text-sm font-medium text-emerald-100/95 md:text-[0.8125rem]">
    On{' '}
    <GeoGuestDrillLink
      to={parentPlacePath}
      state={linkState}
      authReturnPath={parentPlacePath}
      inline
      className={HERO_PARENT_LINK_CLASS}
    >
      {parentPlaceName}
    </GeoGuestDrillLink>
  </p>
);
