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
import { HomeDesktopHero } from '../components/home/HomeDesktopHero';
import { HomeFounderStory } from '../components/home/HomeFounderStory';
import { HomeLiveActivityRail } from '../components/home/HomeLiveActivityRail';
import { HomeMarketingClose } from '../components/home/HomeMarketingClose';
import { HomeMobileLaunch } from '../components/home/HomeMobileLaunch';
import { HomeProductPreview } from '../components/home/HomeProductPreview';
import { HomeProofStrip } from '../components/home/HomeProofStrip';
import { HomeTestimonials } from '../components/home/HomeTestimonials';
import { LandingShell } from '../components/home/LandingShell';
import { HOME_TESTIMONIALS } from '../content/homeLanding';

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

  return (
    <div className="min-h-screen w-full bg-white">
      <PageMeta
        title="Discover hiking & camping in the UAE & GCC"
        description="Find trails, camping spots, and join organized outdoor activities with trusted guides across the UAE and GCC."
        path="/"
        image={DEFAULT_OG_IMAGE}
      />
      <JsonLd data={websiteSchema()} id="website" />

      <HomeMobileLaunch joinHref={joinHref} />
      <HomeDesktopHero joinHref={joinHref} signInHref={signInHref} />

      <div className="home-landing-scroll bg-white">
        <HomeLiveActivityRail activities={activities} loading={loading} fromLiveApi={fromLiveApi} />
        <HomeProofStrip />
        {showProductPreview ? <HomeProductPreview /> : null}
        <HomeTestimonials items={HOME_TESTIMONIALS} />
        <section className="py-8 md:py-12">
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
