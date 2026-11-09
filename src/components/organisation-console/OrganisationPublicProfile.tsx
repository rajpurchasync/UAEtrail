import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  CalendarDays,
  ExternalLink,
  Info,
  Loader2,
  MapPin,
  Pencil,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { ReviewDTO, type ActivityDTO, type TenantPublicDTO } from '@uaetrail/shared-types';
import {
  fetchOrganisationProfileBySlug,
  fetchOrganisationReviews,
  updateOrganisationDetails,
  type HostDetails as OrganisationDetails,
} from '../../hooks/organisationConsoleApi';
import { updateMeProfile } from '../../hooks/memberProfileApi';
import { ReviewSection } from '../ui/ReviewSection';
import { SecureAvatar } from '../ui/SecureAvatar';
import { ShareButton } from '../ui/ShareButton';
import { PageMeta } from '../seo/PageMeta';
import { JsonLd } from '../seo/JsonLd';
import { organizationSchema } from '../seo/schemas';
import { MessageMemberButton } from '../chat/MessageMemberButton';
import { EntityFollowControls } from '../profile/EntityFollowControls';
import {
  memberProfileLink,
  PRO_MEMBERSHIP_PATH,
  SIGNIN_PATH,
  planHostedSchedulePath,
} from '../../config/routingCatalog';
import { GlassCard } from '../mobile/GlassCard';
import { AppButton } from '../mobile/AppButton';
import { AppSelect } from '../ui/AppSelect';
import { ProfileActivityListRow } from '../profile/ProfileActivityListRow';
import { PublicProfileSectionHeading } from '../profile/PublicProfileSectionHeading';
import { AccountSectionHeader } from '../account/AccountSectionHeader';
import { useAuth } from '../../context/AuthContext';
import { COUNTRIES } from '../../constants';
import {
  normalizeWorkspaceBrandKind,
  workspaceNotFoundLabel,
  workspaceProfileLabel,
  workspacePublicProfileLabel,
} from '../../content/workspaceVocabulary';
import { detailBackPath } from '../../config/routingCatalog';
import { tenantBrandPublicPath } from '../../utils/organisationLinks';
import { ConsumerEntityTabBar } from '../mobile/ConsumerEntityTabBar';
import {
  ORGANISATION_PUBLIC_TAB_LABELS,
  ORGANISATION_PUBLIC_TABS,
  type OrganisationPublicDetailTabId,
} from '../../organisation/organisationPublicDetailTab';

const ORG_TAB_ICONS = {
  about: Info,
  outings: CalendarDays,
  contact: Users,
} as const;

const EXPERIENCE_OPTIONS = [
  { value: '<1 year', label: 'Less than 1 year' },
  { value: '1-3 years', label: '1–3 years' },
  { value: '3-5 years', label: '3–5 years' },
  { value: '5+ years', label: '5+ years' },
];

const COUNTRY_OPTIONS = COUNTRIES.map((country) => ({ value: country, label: country }));

const profileSelectClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500';

type ProfileMode = 'public' | 'owner';

interface OrganisationPublicProfileProps {
  slug: string;
  mode?: ProfileMode;
  backTo?: string;
  backLabel?: string;
  /** When true (default), parent shell provides back/title — use GlassCard layout. */
  compact?: boolean;
  /** Public storefront tab layout (S9) — only for `mode="public"` on `/agency` · `/partner`. */
  entityTabLayout?: boolean;
  publicDetailTab?: OrganisationPublicDetailTabId;
  onPublicDetailTabChange?: (tab: OrganisationPublicDetailTabId) => void;
}

export const OrganisationPublicProfile = ({
  slug,
  mode = 'public',
  backTo = detailBackPath('host'),
  backLabel = 'Back to map',
  compact = true,
  entityTabLayout = false,
  publicDetailTab = 'about',
  onPublicDetailTabChange,
}: OrganisationPublicProfileProps) => {
  const { user } = useAuth();
  const isOwner = mode === 'owner';

  const [tenant, setTenant] = useState<TenantPublicDTO | null>(null);
  const [activities, setActivities] = useState<ActivityDTO[]>([]);
  const [reviews, setReviews] = useState<ReviewDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editBio, setEditBio] = useState('');
  const [editDetails, setEditDetails] = useState<OrganisationDetails>({});

  const loadProfile = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchOrganisationProfileBySlug(slug)
      .then(async (tenantData) => {
        setTenant(tenantData);
        setActivities(tenantData.activities);
        setEditBio(tenantData.ownerBio ?? '');
        setEditDetails(tenantData.hostDetails ?? {});
        const reviewList = await fetchOrganisationReviews(tenantData.id).catch(() => []);
        setReviews(reviewList);
      })
      .catch(() => setError(`We couldn't find this ${workspaceProfileLabel(null).toLowerCase()}`))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    loadProfile();
  }, [slug, loadProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    setSaveError(null);
    try {
      await updateMeProfile({ bio: editBio.trim() || undefined });
      await updateOrganisationDetails(editDetails);
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
    const loadingTitle = `Loading ${workspaceProfileLabel(null).toLowerCase()}`;
    return (
      <>
        {!isOwner && <PageMeta title={loadingTitle} noIndex />}
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </>
    );
  }

  if (error || !tenant) {
    return (
      <>
        {!isOwner && <PageMeta title={workspaceNotFoundLabel(null)} noIndex />}
        <GlassCard padding className="text-center">
          <h1 className="text-lg font-bold text-neutral-900">We couldn&apos;t find this host</h1>
          {!compact && (
            <Link to={backTo} className="mt-3 inline-block text-sm font-semibold text-emerald-700">
              {backLabel}
            </Link>
          )}
        </GlassCard>
      </>
    );
  }

  const hostKind = normalizeWorkspaceBrandKind(tenant.type);
  const canonicalPublicPath =
    tenantBrandPublicPath(
      {
        slug: tenant.slug ?? slug,
        ownerId: tenant.ownerId,
        type: tenant.type,
        businessMode: tenant.businessMode,
      },
      slug
    ) ?? `/agency/${slug}`;

  const details = tenant.hostDetails ?? {};
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const detailItems = [
    { label: 'Age', value: details.age != null ? `${details.age} years old` : undefined },
    { label: 'Experience', value: details.experience },
    { label: 'Languages', value: details.languages },
    { label: 'Nationality', value: details.nationality },
    { label: 'Based in', value: details.residence },
  ].filter((item) => item.value);

  const useEntityTabs = entityTabLayout && !isOwner && Boolean(onPublicDetailTabChange);
  const activePublicTab = publicDetailTab;
  const showAboutPanel = !useEntityTabs || activePublicTab === 'about';
  const showOutingsPanel = !useEntityTabs || activePublicTab === 'outings';
  const showContactPanel = !useEntityTabs || activePublicTab === 'contact';

  const orgMobileTabs = ORGANISATION_PUBLIC_TABS.map((id) => ({
    id,
    label: ORGANISATION_PUBLIC_TAB_LABELS[id],
    icon: ORG_TAB_ICONS[id],
  }));

  return (
    <div className="animate-fade-up space-y-3">
      {!isOwner && (
        <>
          <PageMeta
            title={tenant.name}
            description={
              tenant.ownerBio?.slice(0, 160) ?? `Outdoor activities and hikes with ${tenant.name} in the UAE.`
            }
            path={canonicalPublicPath}
            image={tenant.ownerAvatar}
            imageAlt={`${tenant.name} — UAE Trail host`}
          />
          <JsonLd
            data={organizationSchema(tenant, slug, reviews, canonicalPublicPath)}
            id={`org-${tenant.id}`}
          />
        </>
      )}

      {isOwner && (
        <GlassCard padding className="border-emerald-100 bg-emerald-50/50">
          <p className="text-sm leading-relaxed text-neutral-700">
            This is your <strong className="text-neutral-900">{workspacePublicProfileLabel(hostKind)}</strong> — what visitors
            see when they browse your activities.
          </p>
          <Link
            to={canonicalPublicPath}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700"
          >
            Open live page <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </GlassCard>
      )}

      <GlassCard padding className="!p-0 overflow-hidden">
        <div className="relative bg-gradient-to-b from-emerald-50/90 to-white px-5 pb-5 pt-6 text-center lg:flex lg:items-start lg:gap-5 lg:px-5 lg:py-4 lg:text-left">
          <div className="absolute right-3 top-3 flex items-center gap-1">
            <ShareButton
              title={tenant.name}
              text={`Check out ${tenant.name} on UAE Trail — hikes, camps, and outdoor activities in the UAE.`}
              path={canonicalPublicPath}
              iconOnly
              light
            />
          </div>
          <SecureAvatar
            src={tenant.ownerAvatar}
            name={tenant.ownerName}
            className="mx-auto h-24 w-24 text-2xl ring-4 ring-white shadow-md lg:mx-0 lg:h-16 lg:w-16 lg:text-lg"
          />
          <div className="min-w-0 flex-1">
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 lg:mt-0 lg:justify-start">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 lg:text-xl">{tenant.name}</h1>
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden />
          </div>
          {tenant.ownerId && !isOwner ? (
            <Link
              to={memberProfileLink(tenant.ownerId)}
              className="mt-1 inline-block text-sm font-semibold text-emerald-700 hover:underline"
            >
              {tenant.ownerName} · member profile
            </Link>
          ) : (
            <p className="mt-1 text-sm font-medium text-neutral-500">{tenant.ownerName}</p>
          )}
          {tenant.ownerBio && !editing && (
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-neutral-600 lg:mx-0 lg:max-w-2xl">{tenant.ownerBio}</p>
          )}
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-neutral-100 border-t border-neutral-100">
          <div className="px-2 py-4 text-center">
            <p className="text-xl font-bold tabular-nums text-neutral-900">{tenant.memberCount}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Team</p>
          </div>
          <div className="px-2 py-4 text-center">
            <p className="text-xl font-bold tabular-nums text-neutral-900">{activities.length}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Upcoming</p>
          </div>
          <div className="px-2 py-4 text-center">
            <p className="text-xl font-bold tabular-nums text-neutral-900">{avgRating ?? '—'}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              {avgRating ? `Rating (${reviews.length})` : 'Rating'}
            </p>
          </div>
        </div>

        {!isOwner && user?.id !== tenant.ownerId && tenant.ownerId && (
          <div className="space-y-3 border-t border-neutral-100 px-4 py-4">
            {user ? (
              <EntityFollowControls tenantId={tenant.id} />
            ) : (
              <Link
                to={SIGNIN_PATH}
                state={{ from: canonicalPublicPath }}
                className="block text-center text-sm font-semibold text-emerald-700"
              >
                Log in to follow host outing alerts
              </Link>
            )}
            <MessageMemberButton
              memberUserId={tenant.ownerId}
              size="md"
              className="w-full"
              messageLabel="Message"
            />
          </div>
        )}

        {isOwner && (
          <div className="border-t border-neutral-100 px-4 py-4">
            <AppButton
              type="button"
              variant="tint"
              className="w-full"
              onClick={() => setEditing((open) => !open)}
            >
              <Pencil className="mr-1.5 inline h-4 w-4" />
              {editing ? 'Close editor' : 'Edit public profile'}
            </AppButton>
          </div>
        )}
      </GlassCard>

      {useEntityTabs && onPublicDetailTabChange ? (
        <>
          <ConsumerEntityTabBar
            tabs={orgMobileTabs}
            active={activePublicTab}
            onChange={onPublicDetailTabChange}
            ariaLabel="Host profile sections"
          />
          <nav className="hidden md:flex gap-6 border-b border-neutral-200/80 pb-0">
            {ORGANISATION_PUBLIC_TABS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onPublicDetailTabChange(id)}
                className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activePublicTab === id
                    ? 'border-emerald-600 text-emerald-800'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {ORGANISATION_PUBLIC_TAB_LABELS[id]}
              </button>
            ))}
          </nav>
        </>
      ) : null}

      {isOwner && editing && (
        <GlassCard padding>
          <h2 className="mb-4 text-base font-bold text-neutral-900">Edit public profile</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">About</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
                placeholder="Tell visitors about your experience and what makes your activities special..."
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Experience</label>
                <AppSelect
                  value={editDetails.experience ?? ''}
                  onChange={(experience) => setEditDetails({ ...editDetails, experience })}
                  options={EXPERIENCE_OPTIONS}
                  placeholder="Select..."
                  inputClassName={profileSelectClass}
                  aria-label="Experience"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Languages</label>
                <input
                  type="text"
                  value={editDetails.languages ?? ''}
                  onChange={(e) => setEditDetails({ ...editDetails, languages: e.target.value })}
                  placeholder="English, Arabic..."
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Nationality</label>
                <AppSelect
                  value={editDetails.nationality ?? ''}
                  onChange={(nationality) => setEditDetails({ ...editDetails, nationality })}
                  options={COUNTRY_OPTIONS}
                  placeholder="Select country"
                  inputClassName={profileSelectClass}
                  aria-label="Nationality"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">Based in</label>
                <AppSelect
                  value={editDetails.residence ?? ''}
                  onChange={(residence) => setEditDetails({ ...editDetails, residence })}
                  options={COUNTRY_OPTIONS}
                  placeholder="Select country"
                  inputClassName={profileSelectClass}
                  aria-label="Based in"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Certificates & qualifications</label>
              <textarea
                value={editDetails.certificates ?? ''}
                onChange={(e) => setEditDetails({ ...editDetails, certificates: e.target.value })}
                rows={2}
                placeholder="First-aid certified, wilderness guide training..."
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Notable hikes & activities</label>
              <textarea
                value={editDetails.notableHikes ?? ''}
                onChange={(e) => setEditDetails({ ...editDetails, notableHikes: e.target.value })}
                rows={2}
                placeholder="Jebel Jais summit, Wadi Shawka..."
                className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
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
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {showAboutPanel && !editing && detailItems.length > 0 && (
        <GlassCard padding>
          <PublicProfileSectionHeading>About</PublicProfileSectionHeading>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {detailItems.map((item) => (
              <div key={item.label}>
                <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{item.label}</p>
                <p className="mt-1 text-sm text-neutral-800">{item.value}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {showAboutPanel && !editing && details.certificates && (
        <GlassCard padding>
          <h2 className="mb-2 flex items-center gap-2 text-base font-bold text-neutral-900">
            <Award className="h-4 w-4 text-emerald-600" /> Certificates
          </h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">{details.certificates}</p>
        </GlassCard>
      )}

      {showAboutPanel && !editing && details.notableHikes && (
        <GlassCard padding>
          <h2 className="mb-2 flex items-center gap-2 text-base font-bold text-neutral-900">
            <MapPin className="h-4 w-4 text-emerald-600" /> Notable hikes
          </h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">{details.notableHikes}</p>
        </GlassCard>
      )}

      {showContactPanel && tenant.team.length > 1 && (
        <GlassCard padding>
          <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-neutral-900">
            <Users className="h-4 w-4 text-emerald-600" /> Team
          </h2>
          <p className="mb-3 text-xs text-neutral-500">
            {isOwner ? 'Guides and admins who help run activities.' : 'People who help run these adventures.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {tenant.team.map((member, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2">
                <SecureAvatar src={member.avatarUrl} name={member.displayName} className="h-8 w-8 text-xs" />
                <div>
                  <p className="text-sm font-medium text-neutral-900">{member.displayName}</p>
                  <p className="text-xs capitalize text-neutral-500">{member.role.replace('_', ' ')}</p>
                </div>
              </div>
            ))}
          </div>
          {isOwner && (
            <Link to={PRO_MEMBERSHIP_PATH} className="mt-3 inline-block text-sm font-semibold text-emerald-700">
              Manage team →
            </Link>
          )}
        </GlassCard>
      )}

      {showOutingsPanel && (
      <GlassCard padding className="space-y-3">
        <AccountSectionHeader title="Activities hosted" />
        {activities.length === 0 ? (
          <p className="py-4 text-center text-sm text-neutral-500">No upcoming activities scheduled.</p>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <ProfileActivityListRow key={activity.id} activity={activity} />
            ))}
          </div>
        )}
        {isOwner && (
          <Link to={planHostedSchedulePath()} className="inline-block text-sm font-semibold text-emerald-700">
            Manage events →
          </Link>
        )}
      </GlassCard>
      )}

      {showContactPanel && (
      <ReviewSection
        targetType="tenant"
        targetId={tenant.id}
        reviews={reviews}
        onReviewSubmitted={(review) => setReviews((prev) => [review, ...prev])}
      />
      )}
    </div>
  );
};
