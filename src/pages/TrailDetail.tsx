import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, TrendingUp, Clock, Mountain, Baby, ChevronRight } from 'lucide-react';
import { ReviewDTO } from '@uaetrail/shared-types';
import { TripCard, ShareButton, LocationDetailTabs, toLocationDetailData, ReviewSection } from '../components/ui';
import { LocationPremiumSummaryDTO } from '@uaetrail/shared-types';
import { PageMeta } from '../components/seo/PageMeta';
import { JsonLd } from '../components/seo/JsonLd';
import { trailSchema } from '../components/seo/schemas';
import { MobileDetailShell } from '../components/mobile/MobileDetailShell';
import { getDifficultyColor, capitalize } from '../utils';
import { Trail, Trip } from '../types';
import { fetchApiLocationDetail, mapEventToTrip } from '../api/public';
import { api } from '../api/services';

export const TrailDetail = () => {
  const { id } = useParams();
  const [trail, setTrail] = useState<Trail | null>(null);
  const [loading, setLoading] = useState(true);
  const [trailTrips, setTrailTrips] = useState<Trip[]>([]);
  const [trailReviews, setTrailReviews] = useState<ReviewDTO[]>([]);
  const [premium, setPremium] = useState<LocationPremiumSummaryDTO | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    api.trackLocationView(id).catch(() => undefined);
    setLoading(true);
    Promise.all([
      fetchApiLocationDetail(id),
      api.getLocationEvents(id).catch(() => ({ data: [] })),
      api.getReviews('location', id).catch(() => ({ data: [] }))
    ])
      .then(([locResult, eventsRes, reviewsRes]) => {
        setTrail(locResult.trail ?? null);
        setPremium(locResult.premium ?? null);
        setTrailTrips(eventsRes.data.map(mapEventToTrip));
        setTrailReviews(reviewsRes.data);
      })
      .catch(() => setTrail(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <PageMeta title="Loading trail" path={id ? `/trail/${id}` : undefined} />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600" />
        </div>
      </>
    );
  }

  if (!trail) {
    return (
      <>
        <PageMeta title="Trail not found" noIndex path={id ? `/trail/${id}` : undefined} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Trail not found</h1>
          <Link to="/discovery" className="text-emerald-600 hover:text-emerald-700 mt-4 inline-block">
            Back to discovery
          </Link>
        </div>
      </>
    );
  }

  return (
    <MobileDetailShell
      backTo="/discovery"
      backLabel="Trails & Spots"
      banner={{
        src: trail.images[0],
        alt: trail.name,
        title: trail.name,
      }}
    >
    <div className="min-h-screen bg-ios-bg md:bg-gray-50">
      <PageMeta
        title={trail.name}
        description={trail.description?.slice(0, 160) ?? `Explore ${trail.name} — ${trail.region}, UAE`}
        path={`/trail/${trail.id}`}
        image={trail.images?.[0]}
        imageAlt={`${trail.name} hiking trail`}
      />
      <JsonLd data={trailSchema(trail)} id={`trail-${trail.id}`} />
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-end mb-4 hidden md:flex">
            <ShareButton
              title={trail.name}
              text={`${trail.region} · ${trail.distance} km trail on UAE Trails`}
              path={`/trail/${trail.id}`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div className="relative mb-4">
              <img
                src={trail.images[selectedImage]}
                alt={trail.name}
                className="w-full h-96 object-cover rounded-lg"
              />
              <div className="absolute top-3 right-3 z-10">
                <ShareButton
                  title={trail.name}
                  text={`${trail.region} · ${trail.distance} km trail on UAE Trails`}
                  path={`/trail/${trail.id}`}
                  compact
                />
              </div>
            </div>
              <div className="grid grid-cols-4 gap-2">
                {trail.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`h-20 rounded-lg overflow-hidden ${
                      selectedImage === index ? 'ring-2 ring-emerald-600' : ''
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{trail.name}</h1>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-1" />
                    <span>{trail.region}</span>
                  </div>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${getDifficultyColor(
                    trail.difficulty
                  )}`}
                >
                  {capitalize(trail.difficulty)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center text-gray-600 mb-1">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    <span className="text-sm">Distance</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{trail.distance} km</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center text-gray-600 mb-1">
                    <Clock className="w-5 h-5 mr-2" />
                    <span className="text-sm">Duration</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{trail.duration} hrs</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center text-gray-600 mb-1">
                    <Mountain className="w-5 h-5 mr-2" />
                    <span className="text-sm">Elevation</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{trail.elevation} m</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center text-gray-600 mb-1">
                    <Baby className="w-5 h-5 mr-2" />
                    <span className="text-sm">Family</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {trail.childFriendly ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Best Season</h3>
                <div className="flex gap-2">
                  {trail.season.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium capitalize"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <LocationDetailTabs
            data={toLocationDetailData(trail, 'hiking')}
            accent="emerald"
            locationId={trail.id}
            premium={premium}
            onPremiumChange={setPremium}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Upcoming Trips</h2>
              <p className="text-gray-600 mt-1">Join organized hikes at this trail</p>
            </div>
            <Link
              to="/trips"
              className="text-emerald-600 hover:text-emerald-700 font-medium text-sm inline-flex items-center gap-1.5 group shrink-0"
            >
              View all trips
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {trailTrips.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-600">No upcoming trips scheduled for this trail yet.</p>
              <Link to="/trips" className="text-emerald-600 hover:text-emerald-700 mt-2 inline-block">
                Check all upcoming trips
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trailTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </section>

        <ReviewSection
          targetType="location"
          targetId={id!}
          reviews={trailReviews}
          onReviewSubmitted={(review) => setTrailReviews((prev) => [review, ...prev])}
        />
      </div>
    </div>
    </MobileDetailShell>
  );
};
