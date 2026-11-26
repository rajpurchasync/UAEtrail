import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { consumerDetailChildLinkState } from '@/discovery/discoverySessionExploreMapPeekNav';
import { destinationHubPath } from '@uaetrail/shared-types';
import type { GeoAncestorLink } from '../../geo/geoAncestorLinks';
import { GeoAncestorEyebrow } from './GeoAncestorEyebrow';
import { GeoGuestDrillLink } from '../../geo/GeoGuestDrillLink';

const HERO_CRUMB_ON_DARK =
  'underline decoration-white/40 underline-offset-[3px] hover:text-white';
const HERO_CRUMB_ON_LIGHT =
  'underline decoration-emerald-400/50 underline-offset-[3px] hover:text-emerald-950';

/** Region / geo trail plus place hub link — consumer detail hero subtitle. */
export const ConsumerDetailHeroGeoLine = ({
  geoLinks,
  regionFallback,
  placeHubLabel,
  destinationSlug,
  geoHubPath,
  areaLinkState,
  geoLinkBackLabel = 'Back',
  tone = 'onDark',
}: {
  geoLinks: GeoAncestorLink[];
  regionFallback?: string | null;
  placeHubLabel?: string | null;
  destinationSlug?: string | null;
  /** Geo destination hub when no curated `/destination/:slug`. */
  geoHubPath?: string | null;
  /** Router state so destination hub back returns to the opener detail. */
  areaLinkState?: object;
  geoLinkBackLabel?: string;
  tone?: 'onDark' | 'onLight';
}) => {
  const location = useLocation();
  const geoLinkState = useMemo(() => {
    const returnTo = `${location.pathname}${location.search}`;
    return consumerDetailChildLinkState(returnTo, geoLinkBackLabel);
  }, [geoLinkBackLabel, location.pathname, location.search]);
  const region = regionFallback?.trim() ?? '';
  const area = placeHubLabel?.trim() ?? '';
  if (!region && !area && geoLinks.length === 0) return null;

  const crumbClass = tone === 'onLight' ? HERO_CRUMB_ON_LIGHT : HERO_CRUMB_ON_DARK;
  const lineClass =
    tone === 'onLight'
      ? 'text-sm font-medium text-emerald-900/90'
      : 'text-sm font-medium text-emerald-100/95 md:text-[0.8125rem]';

  const hubPath = destinationSlug?.trim()
    ? destinationHubPath(destinationSlug.trim())
    : geoHubPath?.trim() || null;
  const areaNode = area ? (
    hubPath ? (
      <GeoGuestDrillLink
        to={hubPath}
        state={areaLinkState}
        authReturnPath={hubPath}
        inline
        className={crumbClass}
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
      linkClassName={crumbClass}
    />
  );

  const hasAncestor = geoLinks.length > 0 || Boolean(region);

  return (
    <p className={lineClass}>
      {areaNode}
      {areaNode && hasAncestor ? <span aria-hidden> · </span> : null}
      {ancestorNode}
    </p>
  );
};
