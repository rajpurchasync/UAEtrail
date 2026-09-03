import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { ReviewDTO, LocationPremiumSummaryDTO } from '@uaetrail/shared-types';
import { ActivityCard, ShareButton, LocationDetailTabs, toLocationDetailData, ReviewSection } from '../components/ui';
import { PageMeta } from '../components/seo/PageMeta';
import { MobileDetailShell } from '../components/mobile/MobileDetailShell';
import { getDifficultyColor, capitalize } from '../utils';
import { CommunityActivitySpot, ActivityListing } from '../types';
import { fetchApiLocationDetail, mapActivityToListing } from '../api/public';
import { api } from '../api/services';

export const CommunityActivityDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<CommunityActivitySpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationActivities, setLocationActivities] = useState<ActivityListing[]>([]);
  const [eventReviews, setEventReviews] = useState<ReviewDTO[]>([]);
  const [premium, setPremium] = useState<LocationPremiumSummaryDTO | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    api.trackLocationView(id).catch(() => undefined);
    setLoading(true);
    Promise.all([
      fetchApiLocationDetail(id),
      api.getLocationActivities(id).catch(() => ({ data: [] })),
      api.getReviews('location', id).catch(() => ({ data: [] })),
    ])
      .then(([locResult, eventsRes, reviewsRes]) => {
        setEvent(locResult.communityActivity ?? null);
        setPremium(locResult.premium ?? null);
        setLocationActivities(eventsRes.data.map(mapActivityToListing));
        setEventReviews(reviewsRes.data);
      })
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <PageMeta title="Loading event" path={id ? `/community-activity/${id}` : undefined} />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-600" />
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <PageMeta title="Activity not found" noIndex path={id ? `/community-activity/${id}` : undefined} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Community event not found</h1>
          <Link to="/discovery" className="text-violet-600 hover:text-violet-700 mt-4 inline-block">
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
        src: event.images[0],
        alt: event.name,
        title: event.name,
      }}
    >
      <div className="min-h-screen bg-ios-bg md:bg-gray-50">
        <PageMeta
          title={event.name}
          description={event.description?.slice(0, 160) ?? `Community event at ${event.name} — ${event.region}, UAE`}
          path={`/community-activity/${event.id}`}
          image={event.images?.[0]}
          imageAlt={`${event.name} community event`}
        />
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-end mb-4 hidden md:flex">
              <ShareButton
                title={event.name}
                text={`${event.region} · community event on UAE Trails`}
                path={`/community-activity/${event.id}`}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div className="relative mb-4">
                  <img
                    src={event.images[selectedImage]}
                    alt={event.name}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                  <div className="absolute top-3 right-3 z-10">
                    <ShareButton
                      title={event.name}
                      text={`${event.region} · community event on UAE Trails`}
                      path={`/community-activity/${event.id}`}
                      compact
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {event.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`h-20 rounded-lg overflow-hidden ${
                        selectedImage === index ? 'ring-2 ring-violet-600' : ''
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
                    <span className="inline-block mb-2 px-3 py-1 bg-violet-100 text-violet-800 rounded-full text-xs font-semibold">
                      Community Event
                    </span>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{event.name}</h1>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-5 h-5 mr-1" />
                      <span>{event.region}</span>
                    </div>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${getDifficultyColor(event.difficulty)}`}
                  >
                    {capitalize(event.difficulty)}
                  </span>
                </div>

                {(event.distance != null || event.duration != null) && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {event.distance != null && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center text-gray-600 mb-1">
                          <TrendingUp className="w-5 h-5 mr-2" />
                          <span className="text-sm">Distance</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{event.distance} km</div>
                      </div>
                    )}
                    {event.duration != null && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center text-gray-600 mb-1">
                          <Clock className="w-5 h-5 mr-2" />
                          <span className="text-sm">Duration</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{event.duration} hrs</div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Best Season</h3>
                  <div className="flex gap-2">
                    {event.season.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1 bg-violet-100 text-violet-800 rounded-full text-sm font-medium capitalize"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <LocationDetailTabs
              data={toLocationDetailData(event, 'community_activity')}
              accent="violet"
              locationId={event.id}
              premium={premium}
              onPremiumChange={setPremium}
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Upcoming Events</h2>
                <p className="text-gray-600 mt-1">Join trail runs, triathlons, and community races</p>
              </div>
              <Link
                to="/activities"
                className="text-violet-600 hover:text-violet-700 font-medium text-sm inline-flex items-center gap-1.5 group shrink-0"
              >
                View all trips
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {locationActivities.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-600">No upcoming events scheduled at this location yet.</p>
                <Link to="/activities" className="text-violet-600 hover:text-violet-700 mt-2 inline-block">
                  Check all upcoming trips
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {locationActivities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </section>

          <ReviewSection
            targetType="location"
            targetId={id!}
            reviews={eventReviews}
            onReviewSubmitted={(review) => setEventReviews((prev) => [review, ...prev])}
            accent="violet"
          />
        </div>
      </div>
    </MobileDetailShell>
  );
};
