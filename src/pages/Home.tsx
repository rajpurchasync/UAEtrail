import { EXPLORE_MAP_PATH, joinAuthPath } from '../config/routingCatalog';
import { Navigate, useLocation } from 'react-router-dom';
import { DEFAULT_OG_IMAGE } from '../config/seo';
import { PageMeta } from '../components/seo/PageMeta';
import { JsonLd } from '../components/seo/JsonLd';
import { websiteSchema } from '../components/seo/schemas';
import { useAuth } from '../context/AuthContext';
import { useHomeLandingActivities } from '../hooks/useHomeLandingActivities';
import { buildSignInRedirect } from '../utils/authReturnContext';
import { HomeHeroPreload, HomeMarketingHeader } from '../components/home/v2';
import { HomeHeroSection } from '../components/home/v2/sections/HomeHeroSection';
import { HomeActivitiesSection } from '../components/home/v2/sections/HomeActivitiesSection';
import { HomeHowItWorksSection } from '../components/home/v2/sections/HomeHowItWorksSection';
import { HomeReviewsFaqSection } from '../components/home/v2/sections/HomeReviewsFaqSection';
import { HomeMarketingCarouselSyncProvider } from '../components/home/v2/HomeMarketingCarouselSync';
/** Guest marketing funnel only — signed-in users redirect to /explore. See docs/LANDING.md */
export const Home = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { activities, loading, error, refetch } = useHomeLandingActivities();

  if (user) {
    return <Navigate to={EXPLORE_MAP_PATH} replace />;
  }

  const joinHref = joinAuthPath(EXPLORE_MAP_PATH);
  const signInHref = buildSignInRedirect(location).href;
  return (
    <div id="main-content" className="home-v2-font min-h-screen w-full bg-home-surface">
      <PageMeta
        title="Find your hiking or camping crew in the UAE"
        description="Find people to get outside with — hikes, camps, runs, and group outings. Residents and visitors welcome. Browse free, connect, and go together."
        path="/"
        image={DEFAULT_OG_IMAGE}
      />
      <JsonLd data={websiteSchema()} id="website" />
      <HomeHeroPreload />

      <HomeMarketingCarouselSyncProvider>
        <HomeMarketingHeader loginHref={signInHref} signupHref={joinHref} />
        <div className="relative -mt-[var(--header-height-mobile)] md:-mt-[var(--header-height-desktop)]">
          <HomeHeroSection joinHref={joinHref} />
        </div>
        <HomeActivitiesSection
          activities={activities}
          loading={loading}
          error={error}
          onRetry={refetch}
        />
        <HomeHowItWorksSection />
        <HomeReviewsFaqSection />
      </HomeMarketingCarouselSyncProvider>
    </div>
  );
};
