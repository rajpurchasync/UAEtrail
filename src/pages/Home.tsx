import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mountain, Calendar, Star, Menu, X } from 'lucide-react';
import { trails, campingSpots, trips } from '../data';
import { TrailCard, CampingCard, TripCard, LocationSelector } from '../components/ui';
import { CampingSpot, Trail, Trip } from '../types';
import { featureFlags, fetchPublicMappedData } from '../api/public';

export const Home = () => {
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [trailSource, setTrailSource] = useState<Trail[]>(trails);
  const [campSource, setCampSource] = useState<CampingSpot[]>(campingSpots);
  const [tripSource, setTripSource] = useState<Trip[]>(trips);

  useEffect(() => {
    if (!featureFlags.useApiHome) return;
    fetchPublicMappedData()
      .then((response) => {
        setTrailSource(response.trails);
        setCampSource(response.camps);
        setTripSource(response.trips);
      })
      .catch(() => {
        setTrailSource(trails);
        setCampSource(campingSpots);
        setTripSource(trips);
      });
  }, []);

  const featuredTrails = useMemo(() => trailSource.filter((item) => item.featured).slice(0, 3), [trailSource]);
  const featuredCamps = useMemo(() => campSource.filter((item) => item.featured).slice(0, 3), [campSource]);
  const upcomingTrips = useMemo(
    () =>
      tripSource
        .filter((item) => new Date(item.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3),
    [tripSource]
  );

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
      <section
        className="relative h-[480px] bg-cover bg-center"
        style={{
          backgroundImage: 'url(/traveler-hiking-mountains-while-having-his-essentials-backpack.jpg)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />

        <div className="relative h-full flex flex-col">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-4">
            <div className="flex justify-between items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Mountain className="w-6 h-6 text-white" />
                <span className="text-base font-semibold text-white">UAE Trails</span>
              </Link>

              <nav className="hidden md:flex space-x-6 items-center mx-auto">
                <Link to="/" className="text-white hover:text-emerald-200 transition-colors text-sm font-medium">
                  Home
                </Link>
                <Link to="/discovery" className="text-white hover:text-emerald-200 transition-colors text-sm font-medium">
                  Trails and Spots
                </Link>
                <Link to="/calendar" className="text-white hover:text-emerald-200 transition-colors text-sm font-medium">
                  Upcoming Trips
                </Link>
                <Link to="/shop" className="text-white hover:text-emerald-200 transition-colors text-sm font-medium">
                  Shop
                </Link>
                <Link to="/community" className="text-white hover:text-emerald-200 transition-colors text-sm font-medium">
                  Community
                </Link>
                <Link to="/membership" className="text-white hover:text-emerald-200 transition-colors text-sm font-medium">
                  Membership
                </Link>
              </nav>

              <Link
                to="/signup"
                className="hidden md:block px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium border border-white/30"
              >
                Join
              </Link>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {mobileMenuOpen && (
              <div className="md:hidden mt-4 bg-black/30 backdrop-blur-md rounded-lg p-4">
                <div className="space-y-3">
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-white hover:text-emerald-200 transition-colors text-sm font-medium py-2"
                  >
                    Home
                  </Link>
                  <Link
                    to="/discovery"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-white hover:text-emerald-200 transition-colors text-sm font-medium py-2"
                  >
                    Trails and Spots
                  </Link>
                  <Link
                    to="/calendar"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-white hover:text-emerald-200 transition-colors text-sm font-medium py-2"
                  >
                    Upcoming Trips
                  </Link>
                  <Link
                    to="/shop"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-white hover:text-emerald-200 transition-colors text-sm font-medium py-2"
                  >
                    Shop
                  </Link>
                  <Link
                    to="/community"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-white hover:text-emerald-200 transition-colors text-sm font-medium py-2"
                  >
                    Community
                  </Link>
                  <Link
                    to="/membership"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-white hover:text-emerald-200 transition-colors text-sm font-medium py-2"
                  >
                    Membership
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-colors text-sm font-medium border border-white/30"
                  >
                    Join
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 flex items-center justify-center">
            <div className="text-white max-w-4xl text-center px-8 md:px-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Discover Hiking & Camping in the UAE
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl mb-8">
                Explore breathtaking trails, discover perfect camping spots, and join guided adventures across the Emirates.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
                <Link
                  to="/discovery"
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium inline-flex items-center justify-center"
                >
                  <Mountain className="w-5 h-5 mr-2" />
                  Explore Venues
                </Link>
                <button
                  onClick={() => setShowLocationSelector(true)}
                  className="text-white font-medium underline hover:text-emerald-200 transition-colors"
                >
                  Find a spot near you
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 w-full md:w-auto">Popular Trails</h2>
            <Link
              to="/discovery?activity=hiking"
              className="hidden md:block text-emerald-600 hover:text-emerald-700 font-medium"
            >
              View all trails →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTrails.map((trail) => (
              <TrailCard key={trail.id} trail={trail} />
            ))}
          </div>
          <Link
            to="/discovery?activity=hiking"
            className="md:hidden block text-center text-emerald-600 hover:text-emerald-700 font-medium mt-6"
          >
            View all trails →
          </Link>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 w-full md:w-auto">Featured Camping Spots</h2>
            <Link
              to="/discovery?activity=camping"
              className="hidden md:block text-amber-600 hover:text-amber-700 font-medium"
            >
              View all camps →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCamps.map((camp) => (
              <CampingCard key={camp.id} camp={camp} />
            ))}
          </div>
          <Link
            to="/discovery?activity=camping"
            className="md:hidden block text-center text-amber-600 hover:text-amber-700 font-medium mt-6"
          >
            View all camps →
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 text-center md:text-left">
            <div className="mb-4 md:mb-0">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Upcoming Trips</h2>
              <p className="text-gray-600 mt-2">Join organized hiking and camping adventures</p>
            </div>
            <Link
              to="/calendar"
              className="text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center"
            >
              <Calendar className="w-5 h-5 mr-1" />
              View all trips →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">What Our Community Says</h2>
            <p className="text-gray-600">Join thousands of outdoor enthusiasts exploring the UAE</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-3"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.location}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
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
