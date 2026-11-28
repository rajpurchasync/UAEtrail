import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageMeta } from '../components/seo/PageMeta';
import { MEMBER_HOME_PATH } from '../config/surfacePaths';
import { useAuth } from '../context/AuthContext';
import { launchHostWizard } from '../create/launchHostWizard';
import { fetchConsumerDayWeather } from '../detail/weather/fetchConsumerDayWeather';
import { gccTodayIsoDate } from '../detail/weather/weatherDisplayUtils';
import { exploreSearchHomePath } from '../explore/search/exploreSearchRouting';
import { useViewerAnchorGeo } from '../list/browse/useViewerAnchor';
import { applyViewerAnchor, type ViewerAnchor } from '../list/browse/viewerAnchor';
import { MemberHomeHeader } from './MemberHomeHeader';
import { MemberHomeIntentTiles } from './MemberHomeIntentTiles';
import { MemberHomeNearbyBanner } from './MemberHomeNearbyBanner';
import { MemberHomeSuggested } from './MemberHomeSuggested';
import { MemberHomeWeatherRow } from './MemberHomeWeatherRow';
import {
  MEMBER_HOME_SEARCH_PLACEHOLDER,
  MEMBER_HOME_SUBCOPY,
  memberHomeFirstName,
  memberHomeGreeting,
} from './memberHomeCopy';
import { resolveMemberHomeHeaderLabel } from './memberHomeLocation';
import {
  MEMBER_HOME_CANVAS,
  MEMBER_HOME_COLUMN,
  MEMBER_HOME_FEED_STACK,
  MEMBER_HOME_HEADER_CHROME,
  MEMBER_HOME_HERO_GREETING,
  MEMBER_HOME_HERO_LOWER,
  MEMBER_HOME_HERO_SUBCOPY,
  MEMBER_HOME_PRIMARY_STACK,
  MEMBER_HOME_SEARCH_PILL,
} from './memberHomeTheme';

const dubaiHour = (): number => {
  try {
    const hour = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dubai',
      hour: 'numeric',
      hour12: false,
    }).format(new Date());
    return Number.parseInt(hour, 10);
  } catch {
    return new Date().getHours();
  }
};

export const MemberHomePage = () => {
  const { user, initializing } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { geo: anchorGeo, anchor, sessionFix } = useViewerAnchorGeo(true);

  const weatherQuery = useQuery({
    queryKey: ['home', 'weather', anchorGeo.lat, anchorGeo.lng, gccTodayIsoDate()],
    staleTime: 10 * 60 * 1000,
    queryFn: () =>
      fetchConsumerDayWeather({
        lat: anchorGeo.lat,
        lng: anchorGeo.lng,
        date: gccTodayIsoDate(),
      }),
  });

  const liveLabel = weatherQuery.data?.locationName?.trim() || null;

  useEffect(() => {
    if (!liveLabel || !sessionFix) return;
    const pinLat = anchor?.lat;
    const pinLng = anchor?.lng;
    const sameAsDevice =
      pinLat != null &&
      pinLng != null &&
      Math.abs(pinLat - sessionFix.lat) < 0.02 &&
      Math.abs(pinLng - sessionFix.lng) < 0.02;
    if (pinLat != null && pinLng != null && !sameAsDevice) return;
    const lat = pinLat ?? sessionFix.lat;
    const lng = pinLng ?? sessionFix.lng;
    if (anchor?.label === liveLabel && anchor.lat === lat && anchor.lng === lng) return;
    const next: ViewerAnchor = {
      label: liveLabel,
      query: liveLabel,
      lat,
      lng,
      source: anchor?.source ?? 'device',
    };
    applyViewerAnchor(next);
  }, [liveLabel, sessionFix, anchor]);

  const greeting = useMemo(
    () => memberHomeGreeting(dubaiHour(), memberHomeFirstName(user?.displayName)),
    [user?.displayName]
  );

  if (initializing) {
    return <div className={MEMBER_HOME_CANVAS} />;
  }

  const searchHref = exploreSearchHomePath();

  return (
    <div className={MEMBER_HOME_CANVAS}>
      <PageMeta title="Home" path={MEMBER_HOME_PATH} />
      <div className={`${MEMBER_HOME_COLUMN} pt-0 md:pt-4`}>
        <section>
          <div className={MEMBER_HOME_HEADER_CHROME}>
            <MemberHomeHeader
              where={anchor}
              onWhereChange={applyViewerAnchor}
              liveLabel={liveLabel}
            />
          </div>
          <div className={MEMBER_HOME_HERO_LOWER}>
            <MemberHomeWeatherRow
              weather={weatherQuery.data ?? null}
              placeLabel={resolveMemberHomeHeaderLabel(anchor, liveLabel)}
              loading={weatherQuery.isPending}
            />
            <h1 className={MEMBER_HOME_HERO_GREETING}>{greeting}</h1>
            <p className={MEMBER_HOME_HERO_SUBCOPY}>{MEMBER_HOME_SUBCOPY}</p>
            <ProductSearchLauncher href={searchHref} />
          </div>
        </section>
        <div className={MEMBER_HOME_PRIMARY_STACK}>
          <MemberHomeIntentTiles
            onCreateTrip={() =>
              launchHostWizard({
                navigate,
                pathname,
                search,
                route: { surface: 'menu', composeKind: 'activity' },
              })
            }
          />
          <MemberHomeNearbyBanner />
        </div>
        <div className={MEMBER_HOME_FEED_STACK}>
          <MemberHomeSuggested anchorGeo={anchorGeo} />
        </div>
      </div>
    </div>
  );
};

const ProductSearchLauncher = ({ href }: { href: string }) => {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(href)} className={`${MEMBER_HOME_SEARCH_PILL} w-full`}>
      <Search className="h-[18px] w-[18px] shrink-0 text-neutral-400" strokeWidth={2} />
      <span className="min-w-0 flex-1 truncate text-left">{MEMBER_HOME_SEARCH_PLACEHOLDER}</span>
      <SlidersHorizontal className="h-[18px] w-[18px] shrink-0 text-neutral-500" strokeWidth={2} />
    </button>
  );
};
