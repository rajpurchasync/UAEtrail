import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Car, ChevronRight } from 'lucide-react';
import { ReviewDTO, LocationPremiumSummaryDTO } from '@uaetrail/shared-types';
import { ActivityCard, JoinRequestModal, ShareButton, LocationDetailTabs, toLocationDetailData, ReviewSection } from '../components/ui';
import { PageMeta } from '../components/seo/PageMeta';
import { JsonLd } from '../components/seo/JsonLd';
import { campSchema } from '../components/seo/schemas';
import { MobileDetailShell } from '../components/mobile/MobileDetailShell';
import { CampingSpot, ActivityListing } from '../types';
import { fetchApiLocationDetail, mapActivityToListing } from '../api/public';
import { api } from '../api/services';

export const CampDetail = () => {
  const { id } = useParams();
  const [camp, setCamp] = useState<CampingSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [campActivities, setCampActivities] = useState<ActivityListing[]>([]);
  const [campReviews, setCampReviews] = useState<ReviewDTO[]>([]);
  const [premium, setPremium] = useState<LocationPremiumSummaryDTO | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [bookingActivity, setBookingActivity] = useState<ActivityListing | null>(null);

  useEffect(() => {
    if (!id) return;
    api.trackLocationView(id).catch(() => undefined);
    setLoading(true);
    Promise.all([
      fetchApiLocationDetail(id),
      api.getLocationActivities(id).catch(() => ({ data: [] })),
      api.getReviews('location', id).catch(() => ({ data: [] }))
    ])
      .then(([locResult, eventsRes, reviewsRes]) => {
        setCamp(locResult.camp ?? null);
        setPremium(locResult.premium ?? null);
        setCampActivities(eventsRes.data.map(mapActivityToListing));
        setCampReviews(reviewsRes.data);
      })
      .catch(() => setCamp(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <PageMeta title="Loading camp" path={id ? `/camp/${id}` : undefined} />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600" />
        </div>
      </>
    );
  }

  if (!camp) {
    return (
      <>
        <PageMeta title="Camping spot not found" noIndex path={id ? `/camp/${id}` : undefined} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Camping spot not found</h1>
          <Link to="/discovery" className="text-amber-600 hover:text-amber-700 mt-4 inline-block">
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
        src: camp.images[0],
        alt: camp.name,
        title: camp.name,
      }}
    >
    <div className="min-h-screen bg-ios-bg md:bg-gray-50">
      <PageMeta
        title={camp.name}
        description={camp.description?.slice(0, 160) ?? `Camp at ${camp.name} — ${camp.region}, UAE`}
        path={`/camp/${camp.id}`}
        image={camp.images?.[0]}
        imageAlt={`${camp.name} camping spot`}
      />
      <JsonLd data={campSchema(camp)} id={`camp-${camp.id}`} />
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-end mb-4 hidden md:flex">
            <ShareButton
              title={camp.name}
              text={`${camp.region} · camping spot on UAE Trails`}
              path={`/camp/${camp.id}`}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
            <div className="relative mb-4">
                <img
                  src={camp.images[selectedImage]}
                  alt={camp.name}
                  className="w-full h-96 object-cover rounded-lg"
                />
                <div className="absolute top-3 right-3 z-10">
                  <ShareButton
                    title={camp.name}
                    text={`${camp.region} · camping spot on UAE Trails`}
                    path={`/camp/${camp.id}`}
                    compact
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {camp.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`h-20 rounded-lg overflow-hidden ${
                      selectedImage === index ? 'ring-2 ring-amber-600' : ''
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{camp.name}</h1>
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-1" />
                  <span>{camp.region}</span>
                </div>
              </div>

              {camp.accessibility && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                  <Car className="w-4 h-4 text-amber-600" />
                  <span className="capitalize">{camp.accessibility.replace('-', ' ')}</span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Best Season</h3>
                <div className="flex gap-2">
                  {camp.season.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium capitalize"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <LocationDetailTabs
            data={toLocationDetailData(camp, 'camping')}
            accent="amber"
            locationId={camp.id}
            premium={premium}
            onPremiumChange={setPremium}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Upcoming Camping Trips</h2>
              <p className="text-gray-600 mt-1">Join organized camping at this location</p>
            </div>
            <Link
              to="/activities"
              className="text-amber-600 hover:text-amber-700 font-medium text-sm inline-flex items-center gap-1.5 group shrink-0"
            >
              View all trips
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {campActivities.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <p className="text-gray-600">No upcoming trips scheduled for this location yet.</p>
              <Link to="/activities" className="text-amber-600 hover:text-amber-700 mt-2 inline-block">
                Check all upcoming trips
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </section>

        <ReviewSection
          targetType="location"
          targetId={id!}
          reviews={campReviews}
          onReviewSubmitted={(review) => setCampReviews((prev) => [review, ...prev])}
          accent="amber"
        />
      </div>

      {bookingActivity && (
        <JoinRequestModal
          open
          activity={bookingActivity}
          onClose={() => setBookingActivity(null)}
          isFull={bookingActivity.slotsAvailable <= 0}
        />
      )}
    </div>
    </MobileDetailShell>
  );
};
