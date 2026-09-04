import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mountain, Star, ChevronRight, Tent, Compass, Calendar, MapPin } from 'lucide-react';
import { TrailCard } from '../components/ui/TrailCard';
import { CampingCard } from '../components/ui/CampingCard';
import { ActivityCard, EmptyActivitiesBanner } from '../components/ui';
import { DEFAULT_OG_IMAGE, HOME_HERO_IMAGE_JPEG, HOME_HERO_IMAGE_WEBP } from '../config/seo';
import { PageMeta } from '../components/seo/PageMeta';
import { JsonLd } from '../components/seo/JsonLd';
import { FaqPreview } from '../components/seo/FaqPreview';
import { websiteSchema } from '../components/seo/schemas';
import { HOME_FAQ_PREVIEW } from '../content/platformFaqs';
import { CampingSpot, Trail, ActivityListing } from '../types';
import { fetchHomeLandingData, fetchHomeRegionLocations } from '../api/public';
import { api } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { accountRouteByRole } from '../utils/authRouting';
import { getFirstName } from '../utils/userDisplay';
import { SecureAvatar } from '../components/ui/SecureAvatar';
import { TrailPointsPromoBanner } from '../components/rewards';
import { MEMBERSHIP_NAV_LINK } from '../config/platform';
import { EXPLORE_UAE_REGIONS, type ExploreRegionIcon } from '../config/exploreUaeRegions';
import { MobileBrandBar } from '../components/layout/MobileBrandBar';
import { FilterChips } from '../components/mobile/FilterChips';
import {
  ACTIVITY_BROWSE_FILTER_OPTIONS,
  ACTIVITY_KINDS_SUMMARY,
  activitiesBrowsePath,
  browseAllActivitiesOfTypeLabel,
  noScheduledActivitiesMessage,
  type ActivityType,
} from '../config/activityTypes';
import { ACTIVITIES_PATH } from '../constants';

const EXPLORE_REGION_ICONS: Record<ExploreRegionIcon, typeof Mountain> = {
  mountain: Mountain,
  tent: Tent,
  compass: Compass
};

type HomeActivityFilter = 'all' | ActivityType;

const HOME_ACTIVITY_FILTERS = ACTIVITY_BROWSE_FILTER_OPTIONS;

const getLandingLoadErrorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'Live content is temporarily unavailable';
  }

  if (
    /Request failed with status \d{3}/i.test(error.message) ||
    error.message.includes('Failed to reach API')
  ) {
    return 'Live content is temporarily unavailable';
  }

  return error.message;
};

export const Home = () => {
  const [popularTrails, setPopularTrails] = useState<Trail[]>([]);
  const [popularCamps, setPopularCamps] = useState<CampingSpot[]>([]);
  const [featuredActivities, setFeaturedActivities] = useState<ActivityListing[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { user } = useAuth();
  const [allTrails, setAllTrails] = useState<Trail[]>([]);
  const [allCamps, setAllCamps] = useState<CampingSpot[]>([]);
  const [allActivities, setAllActivities] = useState<ActivityListing[]>([]);
  const [activityFilter, setActivityFilter] = useState<HomeActivityFilter>('all');

  useEffect(() => {
    let disposed = false;

    void fetchHomeLandingData()
      .then((data) => {
        if (disposed) return;
        setPopularTrails(data.popularTrails);
        setPopularCamps(data.popularCamps);
        setFeaturedActivities(data.featuredActivities);
        setAllActivities(data.allActivities);
        setLoadError(null);
      })
      .catch((err) => {
        if (disposed) return;
        setLoadError(getLandingLoadErrorMessage(err));
      });

    void fetchHomeRegionLocations()
      .then((data) => {
        if (disposed) return;
        setAllTrails(data.trails);
        setAllCamps(data.camps);
      })
      .catch(() => {
        // Region counts are optional — hero and carousels still render
      });

    return () => {
      disposed = true;
    };
  }, []);

  const upcomingActivities = useMemo(
    () =>
      allActivities
        .filter((item) => new Date(item.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 6),
    [allActivities]
  );

  const displayedActivities = useMemo(() => {
    const base = featuredActivities.length > 0 ? featuredActivities : upcomingActivities;
    if (activityFilter === 'all') return base;
    return base.filter((activity) => activity.activityType === activityFilter);
  }, [featuredActivities, upcomingActivities, activityFilter]);

  const trackView = (locationId: string) => {
    api.trackLocationView(locationId).catch(() => { /* silent */ });
  };

  const testimonials = [
    {
      name: 'Fatima Al Mazrouei',
      location: 'Dubai',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      rating: 5,
      text: 'The best platform for discovering hidden gems in the UAE! The Jebel Jais hike was incredible and the guide was so knowledgeable.'
    },
    {
      name: 'James Mitchell',
      location: 'Abu Dhabi',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      rating: 5,
      text: 'Finally found a community of outdoor enthusiasts in the UAE. The camping trips are well-organized and safe for families.'
    },
    {
      name: 'Sara Ahmed',
      location: 'RAK',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      rating: 5,
      text: 'Love the variety of trails and the detailed information provided. Made it easy to plan my first solo hike in Wadi Shawka!'
    },
    {
      name: 'Mohammed Al Hashmi',
      location: 'Sharjah',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      rating: 5,
      text: 'The community here is amazing. I\'ve made friends through group trips and discovered trails I never knew existed in the Emirates.'
    }
  ];

  return (
    <div className="overflow-x-clip max-w-full">
      <PageMeta
        title="Discover hiking & camping in the UAE & GCC"
        description="Find trails, camping spots, and join organized outdoor trips with trusted guides across the UAE and GCC."
        path="/"
        image={DEFAULT_OG_IMAGE}
      />
      <JsonLd data={websiteSchema()} id="website" />
      {loadError && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm text-center py-2 px-4">
          {loadError}. Some sections may be empty until the API is available.
        </div>
      )}
      {/* ──── Hero ──── */}
      <section className="relative h-[42vh] min-h-[300px] sm:h-[50vh] md:h-[70vh] md:max-h-[600px] overflow-hidden">
        <picture className="absolute inset-0">
          <source srcSet={HOME_HERO_IMAGE_WEBP} type="image/webp" />
          <img
            src={HOME_HERO_IMAGE_JPEG}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover object-center"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/70" />

        <div className="relative h-full">
          {/* Hero header / nav — overlay so headline centers in full image height */}
          <div className="absolute inset-x-0 top-0 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-safe-plus-2 md:pt-4">
            <div className="md:hidden">
              <MobileBrandBar tone="light" />
            </div>

            <div className="hidden md:flex justify-between items-center">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-700 rounded-lg flex items-center justify-center">
                  <Mountain className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-bold text-white tracking-tight">UAE Trail</span>
              </Link>

              <nav className="flex gap-1 items-center bg-white/10 backdrop-blur-md rounded-full px-2 py-1">
                {[
                  { to: '/', label: 'Home' },
                  { to: '/discovery', label: 'Trails & Spots' },
                  { to: '/activities', label: 'Activities' },
                  { to: '/shop', label: 'Shop' },
                  { to: '/community', label: 'Community' },
                  ...(MEMBERSHIP_NAV_LINK ? [MEMBERSHIP_NAV_LINK] : []),
                  { to: '/faq', label: 'Help' },
                ].map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="px-3 py-1.5 rounded-full text-sm font-medium text-white/90 hover:bg-white/15 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {user ? (
                <Link
                  to={accountRouteByRole(user.role)}
                  className="relative flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                  <SecureAvatar
                    src={user.avatarUrl}
                    name={user.displayName || user.email || 'Account'}
                    className="w-6 h-6 text-xs"
                  />
                  {getFirstName(user.displayName, user.email)}
                </Link>
              ) : (
                <Link
                  to="/signin"
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors text-sm font-medium border border-white/30"
                >
                  Log in
                </Link>
              )}
            </div>
          </div>

          {/* Hero content — vertically centered in full hero */}
          <div className="relative z-[1] flex h-full min-h-[300px] items-center justify-center px-5 sm:px-6 md:px-12 pb-6 md:pb-8">
            <div className="text-white w-full max-w-4xl text-center">
              <h1 className="text-[1.75rem] leading-[1.12] sm:text-4xl md:text-5xl lg:text-6xl font-semibold mb-3 md:mb-4 tracking-tight">
                <span className="block sm:whitespace-nowrap">Experience Hiking &amp;</span>
                <span className="block sm:whitespace-nowrap">Camping in the UAE</span>
              </h1>
              <p className="text-sm sm:text-lg md:text-xl text-white/90 mb-5 md:mb-8 max-w-[22rem] sm:max-w-2xl mx-auto leading-relaxed text-balance font-normal">
                Discover spots, join a trip, host an event or build community.{' '}
                <span className="text-white/80">Join real community, real people and a real experience.</span>
              </p>
              <div className="flex flex-row flex-wrap justify-center gap-2.5 md:gap-3">
                <Link
                  to={ACTIVITIES_PATH}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 md:min-h-0 md:px-10 md:py-3.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-all font-medium shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 text-sm md:text-base"
                >
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                  Browse activities
                </Link>
                <Link
                  to="/discovery"
                  className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 md:min-h-0 md:px-10 md:py-3.5 bg-white/15 backdrop-blur-sm text-white rounded-full hover:bg-white/25 transition-all font-medium border border-white/20 text-sm md:text-base"
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  View locations
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrailPointsPromoBanner variant="home" />

      {/* ──── Explore UAE Regions ──── */}
      <section className="py-8 md:py-12 mobile-snap-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
          <div className="flex justify-between items-end mb-5 gap-3">
            <h2 className="text-xl md:text-3xl font-bold text-gray-900">Explore UAE</h2>
            <Link to="/discovery" className="text-emerald-600 hover:text-emerald-700 font-medium text-sm inline-flex items-center gap-1 group shrink-0">
              See all <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 min-w-0">
            {EXPLORE_UAE_REGIONS.map((region) => {
              const RegionIcon = EXPLORE_REGION_ICONS[region.icon];
              const count =
                allTrails.filter((t) => region.regionKeys.some((k) => t.region.includes(k))).length +
                allCamps.filter((c) => region.regionKeys.some((k) => c.region.includes(k))).length;

              return (
              <Link
                key={region.name}
                to={region.discoveryLink}
                className="group relative aspect-[4/3] min-w-0 rounded-[22px] overflow-hidden glass-card-interactive shadow-glass"
              >
                <img
                  src={region.image}
                  alt={region.imageAlt}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <RegionIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <p className="text-white font-semibold text-sm">{region.name}</p>
                  </div>
                  {count > 0 && (
                    <p className="text-white/70 text-xs">{count} locations</p>
                  )}
                </div>
              </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──── Upcoming Activities (swipe) ──── */}
      <section className="py-8 md:py-12 mobile-snap-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
          <div className="flex justify-between items-end mb-5 gap-3">
            <div className="min-w-0">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900">
                {featuredActivities.length > 0 ? 'Featured Activities' : 'Upcoming Activities'}
              </h2>
              <p className="text-sm text-gray-500 mt-1 hidden md:block">
                {featuredActivities.length > 0
                  ? 'Handpicked adventures selected for you'
                  : `Join organized ${ACTIVITY_KINDS_SUMMARY.toLowerCase()}`}
              </p>
            </div>
            <Link
              to={activityFilter === 'all' ? ACTIVITIES_PATH : activitiesBrowsePath(activityFilter)}
              className="text-emerald-600 hover:text-emerald-700 font-medium text-sm inline-flex items-center gap-1.5 group shrink-0"
            >
              All activities
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <FilterChips
            className="mb-5"
            options={HOME_ACTIVITY_FILTERS}
            value={activityFilter}
            onChange={setActivityFilter}
          />
          <div className="mobile-snap-rail md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {displayedActivities.map((activity) => (
              <div key={activity.id} className="mobile-snap-rail__item">
                <ActivityCard activity={activity} variant="featured" />
              </div>
            ))}
            {displayedActivities.length === 0 && (
              <div className="col-span-full min-w-full">
                {activityFilter !== 'all' ? (
                  <div className="rounded-[22px] glass-card px-6 py-10 text-center shadow-glass">
                    <p className="text-sm text-gray-600">
                      {noScheduledActivitiesMessage(activityFilter)}
                    </p>
                    <Link
                      to={activitiesBrowsePath(activityFilter)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700 mt-3"
                    >
                      {browseAllActivitiesOfTypeLabel(activityFilter)}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <EmptyActivitiesBanner />
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ──── Amazing Trails ──── */}
      <section className="py-10 md:py-16 mobile-snap-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
          <div className="flex justify-between items-end mb-6 md:mb-8 gap-3">
            <div className="min-w-0">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900">Amazing Trails</h2>
              <p className="text-sm text-gray-500 mt-1 hidden md:block">Top-rated hiking routes across the Emirates</p>
            </div>
            <Link
              to="/discovery?activity=hiking"
              className="text-emerald-600 hover:text-emerald-700 font-medium text-sm inline-flex items-center gap-1 group shrink-0"
            >
              View all <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="mobile-snap-rail md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {(popularTrails.length > 0 ? popularTrails : allTrails.filter((t) => t.featured).slice(0, 3)).map((trail) => (
              <div key={trail.id} className="mobile-snap-rail__item" onClick={() => trackView(trail.id)}>
                <TrailCard trail={trail} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Awesome Camping Spots ──── */}
      <section className="py-10 md:py-16 bg-gray-50/80 mobile-snap-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
          <div className="flex justify-between items-end mb-6 md:mb-8 gap-3">
            <div className="min-w-0">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900">Awesome Camping Spots</h2>
              <p className="text-sm text-gray-500 mt-1 hidden md:block">Best camp sites handpicked by the community</p>
            </div>
            <Link
              to="/discovery?activity=camping"
              className="text-amber-600 hover:text-amber-700 font-medium text-sm inline-flex items-center gap-1 group shrink-0"
            >
              View all <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="mobile-snap-rail md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {(popularCamps.length > 0 ? popularCamps : allCamps.filter((c) => c.featured).slice(0, 3)).map((camp) => (
              <div key={camp.id} className="mobile-snap-rail__item" onClick={() => trackView(camp.id)}>
                <CampingCard camp={camp} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Testimonials ──── */}
      <section className="py-10 md:py-16 bg-gray-50/80 mobile-snap-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-2">What Our Community Says</h2>
            <p className="text-sm md:text-base text-gray-500">Join thousands of outdoor enthusiasts exploring the UAE</p>
          </div>
          <div className="mobile-snap-rail md:grid-cols-2 lg:grid-cols-4 md:gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="mobile-snap-rail__item bg-white rounded-2xl border border-gray-100 p-5 md:min-w-0 hover:shadow-lg hover:border-gray-200 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    loading="lazy"
                    decoding="async"
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                  />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{testimonial.name}</p>
                    <p className="text-xs text-gray-400">{testimonial.location}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">&ldquo;{testimonial.text}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── FAQ preview ──── */}
      <section className="py-10 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FaqPreview items={HOME_FAQ_PREVIEW} />
        </div>
      </section>

    </div>
  );
};
