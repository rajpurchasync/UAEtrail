import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mountain, Star, MapPin, ChevronRight, Tent, Compass, User } from 'lucide-react';
import { TrailCard, CampingCard, TripCard, LocationSelector, EmptyTripsBanner } from '../components/ui';
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

const EXPLORE_REGION_ICONS: Record<ExploreRegionIcon, typeof Mountain> = {
  mountain: Mountain,
  tent: Tent,
  compass: Compass
};

export const Home = () => {
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [popularTrails, setPopularTrails] = useState<Trail[]>([]);
  const [popularCamps, setPopularCamps] = useState<CampingSpot[]>([]);
  const [featuredTrips, setFeaturedTrips] = useState<Trip[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { user } = useAuth();
  const [allTrails, setAllTrails] = useState<Trail[]>([]);
  const [allCamps, setAllCamps] = useState<CampingSpot[]>([]);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);

  useEffect(() => {
    setLoadError(null);
    Promise.all([
      fetchPopularLocations()
        .then(({ trails: t, camps: c }) => {
          setPopularTrails(t);
          setPopularCamps(c);
        })
        .catch(() => {
          setPopularTrails([]);
          setPopularCamps([]);
        }),
      fetchFeaturedEvents().then(setFeaturedTrips).catch(() => setFeaturedTrips([])),
      fetchPublicMappedData()
        .then(({ trails: t, camps: c, trips: tr }) => {
          setAllTrails(t);
          setAllCamps(c);
          setAllTrips(tr);
        })
        .catch((err) => {
          setLoadError(err instanceof Error ? err.message : 'Failed to load content');
        })
    ]);
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
    <div>
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
        className="relative h-[36vh] min-h-[260px] sm:h-[50vh] md:h-[70vh] md:max-h-[600px] bg-cover bg-center"
        style={{
          backgroundImage: `url(${HOME_HERO_IMAGE})`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/70" />

        <div className="relative h-full flex flex-col">
          {/* Hero header / nav */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-safe-plus-2 md:pt-4">
            <div className="flex justify-between items-center">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-700 rounded-lg flex items-center justify-center">
                  <Mountain className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-bold text-white tracking-tight">UAE Trail</span>
              </Link>

              <nav className="hidden md:flex gap-1 items-center bg-white/10 backdrop-blur-md rounded-full px-2 py-1">
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
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                    {getInitials(user.displayName, user.email)}
                  </span>
                  {getFirstName(user.displayName, user.email)}
                </Link>
              ) : (
                <Link
                  to="/signin"
                  className="hidden md:block px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors text-sm font-medium border border-white/30"
                >
                  Log in
                </Link>
              )}

              <Link
                to={user ? accountRouteByRole(user.role) : '/signin'}
                state={user ? undefined : { from: '/' }}
                className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm text-white"
                aria-label={user ? 'Your profile' : 'Profile'}
              >
                {user ? (
                  <span className="text-xs font-bold">{getInitials(user.displayName, user.email)}</span>
                ) : (
                  <User className="w-5 h-5" strokeWidth={2} />
                )}
              </Link>
            </div>
          </div>

          {/* Hero content */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-white max-w-3xl text-center px-6 md:px-12">
              <h1 className="text-xl xs:text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-2 md:mb-4 leading-[1.12] tracking-tight">
                Discover Hiking &<br className="hidden sm:block" /> Camping in the UAE
              </h1>
              <p className="text-xs xs:text-sm sm:text-lg md:text-xl text-white/80 mb-3 md:mb-8 max-w-2xl mx-auto leading-relaxed">
                Explore breathtaking trails, discover perfect camping spots, and join guided adventures across the Emirates.
              </p>
              <div className="flex flex-col md:flex-row gap-3 justify-center items-center">
                <Link
                  to="/discovery"
                  className="w-[70%] md:w-auto md:min-w-[14rem] px-5 py-2.5 md:px-10 md:py-3.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-all font-semibold inline-flex items-center justify-center shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 text-sm md:text-base"
                >
                  <Compass className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Explore
                </Link>
                <button
                  onClick={() => setShowLocationSelector(true)}
                  className="w-[70%] md:w-auto md:min-w-[14rem] px-5 py-2.5 md:px-10 md:py-3.5 bg-white/15 backdrop-blur-sm text-white rounded-full hover:bg-white/25 transition-all font-medium border border-white/20 inline-flex items-center justify-center text-sm md:text-base"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Near You
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrailPointsPromoBanner variant="home" />

      {/* ──── Explore UAE Regions ──── */}
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-5">
            <h2 className="text-xl md:text-3xl font-bold text-gray-900">Explore UAE</h2>
            <Link to="/discovery" className="text-emerald-600 hover:text-emerald-700 font-medium text-sm inline-flex items-center gap-1 group">
              See all <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {EXPLORE_UAE_REGIONS.map((region) => {
              const RegionIcon = EXPLORE_REGION_ICONS[region.icon];
              const count =
                allTrails.filter((t) => region.regionKeys.some((k) => t.region.includes(k))).length +
                allCamps.filter((c) => region.regionKeys.some((k) => c.region.includes(k))).length;

              return (
              <Link
                key={region.name}
                to={region.discoveryLink}
                className="group relative aspect-[4/3] rounded-[22px] overflow-hidden glass-card-interactive shadow-glass"
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
      <section className="py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-5">
            <div>
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
          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
            {displayedTrips.map((trip) => (
              <div key={trip.id} className="min-w-[300px] md:min-w-0 snap-center shrink-0 md:shrink">
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

      {/* ──── Popular Trails ──── */}
      <section className="py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-6 md:mb-8">
            <div>
              <h2 className="text-xl md:text-3xl font-bold text-gray-900">Popular Trails</h2>
              <p className="text-sm text-gray-500 mt-1 hidden md:block">Top-rated hiking routes across the Emirates</p>
            </div>
            <Link
              to="/discovery?activity=hiking"
              className="text-emerald-600 hover:text-emerald-700 font-medium text-sm inline-flex items-center gap-1 group"
            >
              View all <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {(popularTrails.length > 0 ? popularTrails : allTrails.filter((t) => t.featured).slice(0, 3)).map((trail) => (
              <div key={trail.id} onClick={() => trackView(trail.id)}>
                <TrailCard trail={trail} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── Popular Camping Spots ──── */}
      <section className="py-10 md:py-16 bg-gray-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-6 md:mb-8">
            <div>
              <h2 className="text-xl md:text-3xl font-bold text-gray-900">Popular Camping Spots</h2>
              <p className="text-sm text-gray-500 mt-1 hidden md:block">Best camp sites handpicked by the community</p>
            </div>
            <Link
              to="/discovery?activity=camping"
              className="text-amber-600 hover:text-amber-700 font-medium text-sm inline-flex items-center gap-1 group"
            >
              View all <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {(popularCamps.length > 0 ? popularCamps : allCamps.filter((c) => c.featured).slice(0, 3)).map((camp) => (
              <div key={camp.id} onClick={() => trackView(camp.id)}>
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
      <section className="py-10 md:py-16 bg-gray-50/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-2">What Our Community Says</h2>
            <p className="text-sm md:text-base text-gray-500">Join thousands of outdoor enthusiasts exploring the UAE</p>
          </div>
          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-100 p-5 min-w-[280px] md:min-w-0 snap-center shrink-0 md:shrink hover:shadow-lg hover:border-gray-200 transition-all"
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

      {showLocationSelector && (
        <LocationSelector onClose={() => setShowLocationSelector(false)} />
      )}
    </div>
  );
};
