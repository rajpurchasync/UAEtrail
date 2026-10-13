import { lazy, Suspense } from 'react';
import { EXPLORE_MAP_PATH, joinAuthPath } from '../config/routingCatalog';
import { Navigate } from 'react-router-dom';
import { DEFAULT_OG_IMAGE } from '../config/seo';
import { PageMeta } from '../components/seo/PageMeta';
import { JsonLd } from '../components/seo/JsonLd';
import { websiteSchema } from '../components/seo/schemas';
import { useAuth } from '../context/AuthContext';
import { HomeDeferredMount } from '../components/home/v2/HomeDeferredMount';
import { HomeMarketingHeader } from '../components/home/v2/HomeMarketingHeader';
import { HomeHeroSection } from '../components/home/v2/sections/HomeHeroSection';
import { HomeMarketingCarouselSyncProvider } from '../components/home/v2/HomeMarketingCarouselSync';

const HomeActivitiesBlock = lazy(() =>
  import('../components/home/v2/sections/HomeActivitiesBlock').then((m) => ({
    default: m.HomeActivitiesBlock
  }))
);
const HomeHowItWorksSection = lazy(() =>
  import('../components/home/v2/sections/HomeHowItWorksSection').then((m) => ({
    default: m.HomeHowItWorksSection
  }))
);
const HomeReviewsFaqSection = lazy(() =>
  import('../components/home/v2/sections/HomeReviewsFaqSection').then((m) => ({
    default: m.HomeReviewsFaqSection
  }))
);

/** Guest marketing funnel only — signed-in users redirect to /explore. See docs/LANDING.md */
export const Home = () => {
  const { user } = useAuth();

  if (user) {
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
        <HomeDeferredMount minHeightClass="min-h-[min(36rem,70vh)]">
          <Suspense fallback={null}>
            <HomeHowItWorksSection />
            <HomeReviewsFaqSection />
          </Suspense>
        </HomeDeferredMount>
      </HomeMarketingCarouselSyncProvider>
    </div>
  );
};
