import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mountain, Star, MapPin, ChevronRight, Tent, Compass, Calendar } from 'lucide-react';
import { TrailCard, CampingCard, TripCard, EmptyTripsBanner } from '../components/ui';
import { DEFAULT_OG_IMAGE, HOME_HERO_IMAGE } from '../config/seo';
import { PageMeta } from '../components/seo/PageMeta';
import { JsonLd } from '../components/seo/JsonLd';
import { FaqPreview } from '../components/seo/FaqPreview';
import { websiteSchema } from '../components/seo/schemas';
import { HOME_FAQ_PREVIEW } from '../content/platformFaqs';
import { CampingSpot, Trail, Trip } from '../types';
import { fetchPopularLocations, fetchFeaturedEvents, fetchPublicMappedData } from '../api/public';
import { api } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { accountRouteByRole } from '../utils/authRouting';
import { getInitials, getFirstName } from '../utils/userDisplay';
import { TrailPointsPromoBanner } from '../components/rewards';
import { MEMBERSHIP_NAV_LINK } from '../config/platform';
import { EXPLORE_UAE_REGIONS, type ExploreRegionIcon } from '../config/exploreUaeRegions';
import { MobileBrandBar } from '../components/layout/MobileBrandBar';

const EXPLORE_REGION_ICONS: Record<ExploreRegionIcon, typeof Mountain> = {
  mountain: Mountain,
  tent: Tent,
  compass: Compass
};

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

const LANDING_LOAD_RETRY_DELAYS_MS = [1500, 3000, 5000, 8000];

const isRetryableLandingError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  return error.message.includes('Failed to reach API') || /Request failed with status (5\d{2}|401|403)/i.test(error.message);
};

export const Home = () => {
  const [popularTrails, setPopularTrails] = useState<Trail[]>([]);
  const [popularCamps, setPopularCamps] = useState<CampingSpot[]>([]);
  const [featuredTrips, setFeaturedTrips] = useState<Trip[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { user } = useAuth();
  const [allTrails, setAllTrails] = useState<Trail[]>([]);
  const [allCamps, setAllCamps] = useState<CampingSpot[]>([]);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);

  useEffect(() => {
    let disposed = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const loadLandingData = async (attempt = 0): Promise<void> => {
      if (disposed) return;

      if (attempt === 0) {
        setLoadError(null);
      }

      await Promise.all([
        fetchPopularLocations()
          .then(({ trails: t, camps: c }) => {
            if (disposed) return;
            setPopularTrails(t);
            setPopularCamps(c);
          })
          .catch(() => {
            if (disposed) return;
            setPopularTrails([]);
            setPopularCamps([]);
          }),
        fetchFeaturedEvents()
          .then((trips) => {
            if (disposed) return;
            setFeaturedTrips(trips);
          })
          .catch(() => {
            if (disposed) return;
            setFeaturedTrips([]);
          }),
        fetchPublicMappedData()
          .then(({ trails: t, camps: c, trips: tr }) => {
            if (disposed) return;
            setAllTrails(t);
            setAllCamps(c);
            setAllTrips(tr);
            setLoadError(null);
          })
          .catch((err) => {
            if (disposed) return;

            setLoadError(getLandingLoadErrorMessage(err));
            const nextDelay = LANDING_LOAD_RETRY_DELAYS_MS[attempt];
            if (typeof nextDelay === 'number' && isRetryableLandingError(err)) {
              retryTimer = setTimeout(() => {
                void loadLandingData(attempt + 1);
              }, nextDelay);
            }
          })
      ]);
    };

    void loadLandingData();

    return () => {
      disposed = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, []);

  // If no featured events from admin, show upcoming from all events
  const upcomingTrips = useMemo(
    () =>
      allTrips
        .filter((item) => new Date(item.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 6),
    [allTrips]
  );

  const displayedTrips = featuredTrips.length > 0 ? featuredTrips : upcomingTrips;

  // Track a location view when user clicks
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
      <section
        className="relative h-[42vh] min-h-[300px] sm:h-[50vh] md:h-[70vh] md:max-h-[600px] bg-cover bg-center"
        style={{
          backgroundImage: `url(${HOME_HERO_IMAGE})`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/70" />

        <div className="relative h-full flex flex-col">
          {/* Hero header / nav */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-safe-plus-2 md:pt-4">
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
                  { to: '/trips', label: 'Trips' },
                  { to: '/shop', label: 'Shop' },
                  { to: '/community', label: 'Community' },
                  ...(MEMBERSHIP_NAV_LINK ? [MEMBERSHIP_NAV_LINK] : []),
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
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                    {getInitials(user.displayName, user.email)}
                  </span>
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

          {/* Hero content */}
          <div className="flex-1 flex items-center justify-center pb-4 md:pb-0">
            <div className="text-white w-full max-w-3xl text-center px-5 sm:px-6 md:px-12">
              <h1 className="text-[1.625rem] leading-[1.2] sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-2.5 md:mb-4 tracking-tight text-balance">
                Your pocket guide for Hiking &amp; Camping in the UAE
              </h1>
              <p className="text-sm sm:text-lg md:text-xl text-white/90 mb-5 md:mb-8 max-w-[22rem] sm:max-w-2xl mx-auto leading-relaxed text-balance">
                Hike, camp, host trips, and connect with the outdoor community, all in one place.
              </p>
              <div className="flex flex-row flex-wrap justify-center gap-2.5 md:gap-3">
                <Link
                  to="/discovery"
                  className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 md:min-h-0 md:px-10 md:py-3.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-all font-semibold shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 text-sm md:text-base"
                >
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                  Trails &amp; Spots
                </Link>
                <Link
                  to="/trips"
                  className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 md:min-h-0 md:px-10 md:py-3.5 bg-white/15 backdrop-blur-sm text-white rounded-full hover:bg-white/25 transition-all font-medium border border-white/20 text-sm md:text-base"
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  Upcoming Trips
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

      {/* ──── Upcoming Trips (swipe) ──── */}
      <section className="py-8 md:py-12 mobile-snap-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0">
          <div className="flex justify-between items-end mb-5 gap-3">
            <div className="min-w-0">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900">
                {featuredTrips.length > 0 ? 'Featured Events' : 'Organized Trips'}
              </h2>
              <p className="text-sm text-gray-500 mt-1 hidden md:block">
                {featuredTrips.length > 0 ? 'Handpicked adventures selected for you' : 'Join organized hiking and camping adventures'}
              </p>
            </div>
            <Link
              to="/trips"
              className="text-emerald-600 hover:text-emerald-700 font-medium text-sm inline-flex items-center gap-1.5 group shrink-0"
            >
              All trips
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="mobile-snap-rail md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {displayedTrips.map((trip) => (
              <div key={trip.id} className="mobile-snap-rail__item">
                <TripCard trip={trip} variant="featured" />
              </div>
            ))}
            {displayedTrips.length === 0 && (
              <div className="col-span-full min-w-full">
                <EmptyTripsBanner />
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

      {/* ──── FAQ preview ──── */}
      <section className="py-10 md:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FaqPreview items={HOME_FAQ_PREVIEW} />
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

    </div>
  );
};
