import { lazy, Suspense } from 'react';
import { EXPLORE_MAP_PATH, hasSessionExpiredQuery, joinAuthPath } from '../config/routingCatalogLite';
import { ADMIN_OVERVIEW_PATH } from '../config/adminSurfacePaths';
import { Navigate, useSearchParams } from 'react-router-dom';
import { DEFAULT_OG_IMAGE } from '../config/seo';
import { PageMeta } from '../components/seo/PageMeta';
import { JsonLd } from '../components/seo/JsonLd';
import { websiteSchema } from '../components/seo/websiteSchema';
import { useAuth } from '../context/AuthContext';
import { isPlatformAdmin } from '../utils/roles';
import { HomeDeferredMount } from '../components/home/marketing/HomeDeferredMount';
import { HomeMarketingHeader } from '../components/home/marketing/HomeMarketingHeader';
import { HomeHeroSection } from '../components/home/marketing/sections/HomeHeroSection';
import { HomeMarketingCarouselSyncProvider } from '../components/home/marketing/HomeMarketingCarouselSync';
import { useIsMobile } from '../hooks/useIsMobile';
import { sessionExpiredExplorePath } from '../utils/authSessionLanding';

const HomeActivitiesBlock = lazy(() =>
  import('../components/home/marketing/sections/HomeActivitiesBlock').then((m) => ({
    default: m.HomeActivitiesBlock
  }))
);
const HomeHowItWorksSection = lazy(() =>
  import('../components/home/marketing/sections/HomeHowItWorksSection').then((m) => ({
    default: m.HomeHowItWorksSection
  }))
);
const HomeReviewsFaqSection = lazy(() =>
  import('../components/home/marketing/sections/HomeReviewsFaqSection').then((m) => ({
    default: m.HomeReviewsFaqSection
  }))
);

/** Guest marketing funnel only — signed-in users redirect to /explore. See docs/LANDING.md */
export const Home = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const sessionExpired = hasSessionExpiredQuery(searchParams);

  if (!user && isMobile && sessionExpired) {
    return <Navigate to={sessionExpiredExplorePath()} replace />;
  }

  if (user) {
    if (isPlatformAdmin(user.role)) {
      return <Navigate to={ADMIN_OVERVIEW_PATH} replace />;
    }
    return <Navigate to={EXPLORE_MAP_PATH} replace />;
  }

  const joinHref = joinAuthPath(EXPLORE_MAP_PATH);
  return (
    <div id="main-content" className="home-v2-font min-h-screen w-full bg-home-surface">
      <PageMeta
        title="Find your hiking or camping crew in the UAE"
        description="Find people to get outside with — hikes, camps, runs, and group outings. Residents and visitors welcome. Browse free, connect, and go together."
        path="/"
        image={DEFAULT_OG_IMAGE}
      />
      <JsonLd data={websiteSchema()} id="website" />
      <HomeMarketingCarouselSyncProvider>
        <HomeMarketingHeader signupHref={joinHref} />
        <div className="relative -mt-[var(--header-height-mobile)] md:-mt-[var(--header-height-desktop)]">
          <HomeHeroSection />
        </div>
        <HomeDeferredMount>
          <Suspense fallback={null}>
            <HomeActivitiesBlock />
          </Suspense>
        </HomeDeferredMount>
        <HomeDeferredMount minHeightClass="min-h-[min(24rem,50vh)]">
          <Suspense fallback={null}>
            <HomeHowItWorksSection />
          </Suspense>
        </HomeDeferredMount>
        <HomeDeferredMount minHeightClass="min-h-[min(24rem,50vh)]">
          <Suspense fallback={null}>
            <HomeReviewsFaqSection />
          </Suspense>
        </HomeDeferredMount>
      </HomeMarketingCarouselSyncProvider>
    </div>
  );
};
