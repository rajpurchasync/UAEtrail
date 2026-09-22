import { Navigate, useLocation } from 'react-router-dom';
import { DEFAULT_OG_IMAGE } from '../config/seo';
import { PageMeta } from '../components/seo/PageMeta';
import { JsonLd } from '../components/seo/JsonLd';
import { FaqPreview } from '../components/seo/FaqPreview';
import { websiteSchema } from '../components/seo/schemas';
import { HOME_FAQ_PREVIEW } from '../content/platformFaqs';
import { useAuth } from '../context/AuthContext';
import { useHomeLandingActivities } from '../hooks/useHomeLandingActivities';
import { EXPLORE_MAP_PATH, joinAuthPath } from '../config/platform';
import { buildSignInRedirect } from '../utils/authReturnContext';
import { HomeDayTimeline } from '../components/home/HomeDayTimeline';
import { HomeDesktopHero } from '../components/home/HomeDesktopHero';
import { HomeFounderStory } from '../components/home/HomeFounderStory';
import { HomeLiveActivityRail } from '../components/home/HomeLiveActivityRail';
import { HomeMarketingClose } from '../components/home/HomeMarketingClose';
import { HomeMobileLaunch } from '../components/home/HomeMobileLaunch';
import { HomeProductPreview } from '../components/home/HomeProductPreview';
import { HomeProofStrip } from '../components/home/HomeProofStrip';
import { HomeTestimonials } from '../components/home/HomeTestimonials';
import { HomeValueProps } from '../components/home/HomeValueProps';
import { LandingShell } from '../components/home/LandingShell';
import { HOME_TESTIMONIALS } from '../content/homeLanding';

/** Guest marketing funnel only — signed-in users redirect to /explore. See docs/LANDING.md */
export const Home = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { activities, loading, fromLiveApi } = useHomeLandingActivities();

  if (user) {
    return <Navigate to={EXPLORE_MAP_PATH} replace />;
  }

  const joinHref = joinAuthPath(EXPLORE_MAP_PATH);
  const signInHref = buildSignInRedirect(location).href;
  const showProductPreview = !fromLiveApi || loading || activities.length < 2;
  const hideProductPreviewOnMobile = fromLiveApi && !loading && activities.length >= 2;

  return (
    <div className="min-h-screen w-full bg-white">
      <PageMeta
        title="Find your outdoor crew in the UAE & GCC"
        description="Find people to get outside with — hikes, camps, runs, and group outings. Residents and visitors welcome. Browse free, connect, and go together."
        path="/"
        image={DEFAULT_OG_IMAGE}
      />
      <JsonLd data={websiteSchema()} id="website" />

      <HomeMobileLaunch joinHref={joinHref} />
      <HomeDesktopHero joinHref={joinHref} signInHref={signInHref} />

      <div className="home-landing-scroll bg-white">
        <HomeProofStrip />
        <HomeLiveActivityRail activities={activities} loading={loading} fromLiveApi={fromLiveApi} />
        <HomeValueProps />
        <HomeDayTimeline />
        {showProductPreview ? (
          <div className={hideProductPreviewOnMobile ? 'hidden md:block' : undefined}>
            <HomeProductPreview />
          </div>
        ) : null}
        <HomeTestimonials items={HOME_TESTIMONIALS} />
        <section className="border-b border-neutral-100 bg-neutral-50/40 py-6 md:py-12">
          <LandingShell className="max-w-3xl md:mx-auto">
            <FaqPreview items={HOME_FAQ_PREVIEW} mobileLimit={2} compact />
          </LandingShell>
        </section>
        <HomeMarketingClose joinHref={joinHref} />
        <HomeFounderStory />
      </div>
    </div>
  );
};
