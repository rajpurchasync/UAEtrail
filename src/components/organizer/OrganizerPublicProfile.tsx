import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  Mountain,
  Pencil,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import { ReviewDTO } from '@uaetrail/shared-types';
import { NAV_ICONS } from '../../config/navIcons';
import { api, OrganizerDetails, TenantProfile } from '../../api/services';
import { mapEventToTrip } from '../../api/public';
import { TripCard } from '../ui/TripCard';
import { ReviewSection } from '../ui/ReviewSection';
import { PageMeta } from '../seo/PageMeta';
import { JsonLd } from '../seo/JsonLd';
import { organizationSchema } from '../seo/schemas';
import { OrganizerMessageButton } from '../ui/OrganizerMessageButton';
import { GlassCard } from '../mobile/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { COUNTRIES } from '../../constants';

type ProfileMode = 'public' | 'owner';

interface OrganizerPublicProfileProps {
  slug: string;
  mode?: ProfileMode;
  backTo?: string;
  backLabel?: string;
}

export const OrganizerPublicProfile = ({
  slug,
  mode = 'public',
  backTo = '/trips',
  backLabel = 'Back to trips',
}: OrganizerPublicProfileProps) => {
  const { user } = useAuth();
  const isOwner = mode === 'owner';

  const [tenant, setTenant] = useState<TenantProfile | null>(null);
  const [trips, setTrips] = useState<ReturnType<typeof mapEventToTrip>[]>([]);
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editBio, setEditBio] = useState('');
  const [editDetails, setEditDetails] = useState<OrganizerDetails>({});

  const loadProfile = () => {
    setLoading(true);
    setError(null);
    api
      .getTenantProfile(slug)
      .then(async (tenantRes) => {
        setTenant(tenantRes.data);
        setTrips(tenantRes.data.events.map(mapEventToTrip));
        setEditBio(tenantRes.data.ownerBio ?? '');
        setEditDetails(tenantRes.data.organizerDetails ?? {});
        const reviewsRes = await api.getReviews('tenant', tenantRes.data.id).catch(() => ({ data: [] }));
        setReviews(reviewsRes.data);
      })
      .catch(() => setError('Organizer not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!slug) return;
    loadProfile();
  }, [slug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);
    try {
      await api.updateMeProfile({ bio: editBio.trim() || undefined });
      await api.updateOrganizerDetails(editDetails);
      setSaveMessage('Public profile updated.');
      setEditing(false);
      loadProfile();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageMeta title="Loading organizer" noIndex />
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </>
    );
  }

  if (error || !tenant) {
    return (
      <>
        <PageMeta title="Organizer not found" noIndex />
        <div className="min-h-[40vh] flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-3">Organizer not found</h1>
            <Link to={backTo} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
              {backLabel}
            </Link>
          </div>
        </div>
      </>
    );
  }

  const details = tenant.organizerDetails ?? {};
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const detailItems = [
    { label: 'Experience', value: details.experience },
    { label: 'Languages', value: details.languages },
    { label: 'Nationality', value: details.nationality },
    { label: 'Based in', value: details.residence },
  ].filter((item) => item.value);

  return (
    <div className={isOwner ? '' : 'min-h-screen bg-gray-50 md:pb-0'}>
      {!isOwner && (
        <>
          <PageMeta
            title={tenant.name}
            description={
              tenant.ownerBio?.slice(0, 160) ??
              `Outdoor trips and hikes with ${tenant.name} in the UAE.`
            }
            path={`/operator/${slug}`}
            image={tenant.ownerAvatar}
            imageAlt={`${tenant.name} — UAE Trail organizer`}
          />
          <JsonLd data={organizationSchema(tenant, slug, reviews)} id={`org-${tenant.id}`} />
        </>
      )}
      <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-b-2xl md:rounded-none">
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
          <Link
            to={isOwner ? '/organizer/overview' : backTo}
            className="inline-flex items-center gap-1 text-emerald-200 hover:text-white text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> {isOwner ? 'Organizer hub' : backLabel}
          </Link>

          {isOwner && (
            <GlassCard padding className="mb-4 !bg-white/10 !border-white/20 text-emerald-50">
              <p className="text-sm">
                This is your <strong className="text-white">public organizer profile</strong> — what visitors see
                when they browse your trips.
              </p>
              <Link
                to={`/operator/${tenant.slug}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white mt-2 hover:underline"
              >
                Open live page <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </GlassCard>
          )}

          <div className="flex flex-col sm:flex-row items-start gap-5">
            {tenant.ownerAvatar ? (
              <img
                src={tenant.ownerAvatar}
                alt={tenant.ownerName}
                className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white/20"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-emerald-600 flex items-center justify-center text-3xl font-bold ring-4 ring-white/20">
                {tenant.ownerName.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold">{tenant.name}</h1>
                <ShieldCheck className="w-5 h-5 text-emerald-300" aria-hidden />
              </div>
              <p className="text-emerald-100 mt-1">{tenant.ownerName}</p>
              {tenant.ownerBio && !editing && (
                <p className="text-emerald-50/90 mt-3 max-w-2xl">{tenant.ownerBio}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-emerald-100">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" /> {tenant.memberCount} team
                </span>
                <span className="flex items-center gap-1">
                  <NAV_ICONS.trips className="w-4 h-4" strokeWidth={2} /> {trips.length} upcoming
                </span>
                {avgRating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-300 text-amber-300" /> {avgRating} ({reviews.length})
                  </span>
                )}
              </div>
              {!isOwner && user?.id !== tenant.ownerId && (
                <div className="mt-4">
                  <OrganizerMessageButton
                    organizerUserId={tenant.ownerId}
                    signInReturnTo={`/operator/${tenant.slug}`}
                    size="md"
                    className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
                  />
                </div>
              )}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setEditing((open) => !open)}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-sm font-semibold"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {editing ? 'Close editor' : 'Edit public profile'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-8">
        {isOwner && editing && (
          <GlassCard padding>
            <h2 className="text-lg font-bold text-neutral-900 mb-4">Edit public profile</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-1 block">About</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  placeholder="Tell visitors about your experience and what makes your trips special..."
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-1 block">Experience</label>
                  <select
                    value={editDetails.experience ?? ''}
                    onChange={(e) => setEditDetails({ ...editDetails, experience: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="<1 year">Less than 1 year</option>
                    <option value="1-3 years">1–3 years</option>
                    <option value="3-5 years">3–5 years</option>
                    <option value="5+ years">5+ years</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-1 block">Languages</label>
                  <input
                    type="text"
                    value={editDetails.languages ?? ''}
                    onChange={(e) => setEditDetails({ ...editDetails, languages: e.target.value })}
                    placeholder="English, Arabic..."
                    className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-1 block">Nationality</label>
                  <select
                    value={editDetails.nationality ?? ''}
                    onChange={(e) => setEditDetails({ ...editDetails, nationality: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700 mb-1 block">Based in</label>
                  <select
                    value={editDetails.residence ?? ''}
                    onChange={(e) => setEditDetails({ ...editDetails, residence: e.target.value })}
                    className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-1 block">Certificates & qualifications</label>
                <textarea
                  value={editDetails.certificates ?? ''}
                  onChange={(e) => setEditDetails({ ...editDetails, certificates: e.target.value })}
                  rows={2}
                  placeholder="First-aid certified, wilderness guide training..."
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700 mb-1 block">Notable hikes & trips</label>
                <textarea
                  value={editDetails.notableHikes ?? ''}
                  onChange={(e) => setEditDetails({ ...editDetails, notableHikes: e.target.value })}
                  rows={2}
                  placeholder="Jebel Jais summit, Wadi Shawka..."
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              {saveMessage && <p className="text-sm text-emerald-700">{saveMessage}</p>}
              {saveError && <p className="text-sm text-red-600">{saveError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save profile'}
                </button>
              </div>
            </form>
          </GlassCard>
        )}

        {!editing && detailItems.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600" /> About
            </h2>
            <div className="bg-white rounded-xl border p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {detailItems.map((item) => (
                <div key={item.label}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{item.label}</p>
                  <p className="text-sm text-neutral-800 mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {!editing && details.certificates && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" /> Certificates
            </h2>
            <div className="bg-white rounded-xl border p-5">
              <p className="text-sm text-neutral-700 whitespace-pre-line">{details.certificates}</p>
            </div>
          </section>
        )}

        {!editing && details.notableHikes && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" /> Notable hikes
            </h2>
            <div className="bg-white rounded-xl border p-5">
              <p className="text-sm text-neutral-700 whitespace-pre-line">{details.notableHikes}</p>
            </div>
          </section>
        )}

        {tenant.team.length > 1 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" /> Team
            </h2>
            <p className="text-sm text-neutral-500 mb-3">
              {isOwner ? 'Guides and admins who help run trips.' : 'People who help run these adventures.'}
            </p>
            <div className="flex flex-wrap gap-3">
              {tenant.team.map((member, i) => (
                <div key={i} className="flex items-center gap-2 bg-white rounded-xl border px-3 py-2">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700">
                      {member.displayName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{member.displayName}</p>
                    <p className="text-xs text-gray-500 capitalize">{member.role.replace('_', ' ')}</p>
                  </div>
                </div>
              ))}
            </div>
            {isOwner && (
              <Link to="/organizer/team" className="inline-block text-sm font-semibold text-emerald-700 mt-3 hover:underline">
                Manage team →
              </Link>
            )}
          </section>
        )}

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Mountain className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900">Trips hosted</h2>
          </div>
          {trips.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-600">
              No upcoming trips scheduled.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
          {isOwner && (
            <Link to="/organizer/events" className="inline-block text-sm font-semibold text-emerald-700 mt-3 hover:underline">
              Manage events →
            </Link>
          )}
        </section>

        <ReviewSection
          targetType="tenant"
          targetId={tenant.id}
          reviews={reviews}
          onReviewSubmitted={(review) => setReviews((prev) => [review, ...prev])}
        />
      </div>
    </div>
  );
};
