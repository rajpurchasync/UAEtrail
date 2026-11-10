import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { consumerDetailChildLinkState } from '../../explore/mapPeekDetailNavState';
import { areaDetailPath } from '@uaetrail/shared-types';
import type { GeoAncestorLink } from '../../geo/geoAncestorLinks';
import { GeoAncestorEyebrow } from './GeoAncestorEyebrow';
import { GeoGuestDrillLink } from '../../geo/GeoGuestDrillLink';

const HERO_CRUMB_CLASS =
  'underline decoration-white/40 underline-offset-[3px] hover:text-white';

/** Region / geo trail plus curated area link — consumer detail hero subtitle. */
export const ConsumerDetailHeroGeoLine = ({
  geoLinks,
  regionFallback,
  areaLabel,
  areaSlug,
  areaLinkState,
  geoLinkBackLabel = 'Back',
}: {
  geoLinks: GeoAncestorLink[];
  regionFallback?: string | null;
  areaLabel?: string | null;
  areaSlug?: string | null;
  /** Router state so area hub back returns to the opener detail. */
  areaLinkState?: object;
  geoLinkBackLabel?: string;
}) => {
  const location = useLocation();
  const geoLinkState = useMemo(() => {
    const returnTo = `${location.pathname}${location.search}`;
    return consumerDetailChildLinkState(returnTo, geoLinkBackLabel);
  }, [geoLinkBackLabel, location.pathname, location.search]);
  const region = regionFallback?.trim() ?? '';
  const area = areaLabel?.trim() ?? '';
  if (!region && !area && geoLinks.length === 0) return null;

  const areaNode = area ? (
    areaSlug ? (
      <GeoGuestDrillLink
        to={areaDetailPath(areaSlug)}
        state={areaLinkState}
        authReturnPath={areaDetailPath(areaSlug)}
        inline
        className={HERO_CRUMB_CLASS}
      >
        {area}
      </GeoGuestDrillLink>
    ) : (
      <span>{area}</span>
    )
  ) : null;

  const ancestorNode = (
    <GeoAncestorEyebrow
      links={geoLinks}
      fallbackLabel={geoLinks.length === 0 ? region || null : null}
      linkState={geoLinkState}
    />
  );

  const hasAncestor = geoLinks.length > 0 || Boolean(region);

  return (
    <p className="text-sm font-medium text-emerald-100/95 md:text-[0.8125rem]">
      {areaNode}
      {areaNode && hasAncestor ? <span aria-hidden> · </span> : null}
      {ancestorNode}
    </p>
  );
};
