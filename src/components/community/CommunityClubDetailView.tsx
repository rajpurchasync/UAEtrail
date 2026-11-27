import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Users } from 'lucide-react';
import type {
  ActivityDTO,
  CommunityDiscoverDetailDTO,
  CommunityHostProfilePatchDTO,
} from '@uaetrail/shared-types';
import { PageMeta } from '@/components/seo/PageMeta';
import { ShareButton } from '@/components/ui';
import {
  ChipRow,
  ConsumerDetailSection,
  ConsumerDetailSectionJumpNav,
  DetailPageShell,
  HeroBanner,
  SectionCard,
  StatGrid,
  StatTile,
} from '@/detail/shell';
import { communityClubPath, exploreCrewsPath, joinAuthPath } from '@/config/routingCatalog';
import { EXPLORE_PEEK_CTA } from '@/config/exploreTheme';
import {
  COMMUNITY_OUTINGS_EMPTY_BODY,
  COMMUNITY_OUTINGS_EMPTY_TITLE,
  communityJoinCtaLabel,
  communityJoinPolicyLabel,
  COMMUNITY_MEMBERSHIP_JOINED_LABEL,
  COMMUNITY_MEMBERSHIP_REQUESTED_LABEL,
} from '@/content/communityDiscoverCopy';
import { CONSUMER_DETAIL_OVERVIEW_LABEL } from '@/content/consumerDetailSectionLabels';
import { useAuth } from '@/context/AuthContext';
import {
  useJoinDiscoverableCommunity,
  useLeaveDiscoverableCommunity,
  usePatchCommunityProfileByHost,
} from '@/crew-discovery/hooks/useCommunityDiscoverDetail';
import {
  useCommunityDiscoverActivities,
  useLinkCommunityActivity,
} from '@/crew-discovery/hooks/useCommunityDiscoverActivities';
import { ProfileActivityListRow } from '@/components/profile/ProfileActivityListRow';
import { CommunityHostManageSection } from '@/components/community/CommunityHostManageSection';

type CommunityClubDetailViewProps = {
  data: CommunityDiscoverDetailDTO;
};

const geoEyebrow = (data: CommunityDiscoverDetailDTO) => {
  const area = data.geoRef.names.area || data.geoRef.names.state;
  return [data.geoRef.names.country, area].filter(Boolean).join(' · ');
};

export const CommunityClubDetailView = ({ data }: CommunityClubDetailViewProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const joinMutation = useJoinDiscoverableCommunity(data.slug);
  const leaveMutation = useLeaveDiscoverableCommunity(data.slug);
  const patchMutation = usePatchCommunityProfileByHost(data.slug);
  const outingsQuery = useCommunityDiscoverActivities(data.slug);
  const linkActivityMutation = useLinkCommunityActivity(data.slug);

  const membershipStatus = data.viewerMembership?.status;
  const isMember = membershipStatus === 'member';
  const isPending = membershipStatus === 'pending';
  const canJoinOpen = data.joinPolicy === 'open' && !membershipStatus;
  const canRequestJoin = data.joinPolicy === 'request' && !membershipStatus;
  const canAcceptInvite = data.joinPolicy === 'invite' && data.viewerHasInvite && !membershipStatus;
  const canJoin = canJoinOpen || canRequestJoin || canAcceptInvite;

  const publicPath = communityClubPath(data.slug);
  const mapBack = exploreCrewsPath({ list: true });

  const jumpLinks = useMemo(
    () => [
      { href: '#community-about', label: CONSUMER_DETAIL_OVERVIEW_LABEL, sectionId: 'community-about' },
      { href: '#community-policies', label: 'Policies', sectionId: 'community-policies' },
      { href: '#community-outings', label: 'Outings', sectionId: 'community-outings' },
      ...(data.viewerIsHost
        ? [
            { href: '#community-members', label: 'Members', sectionId: 'community-members' },
            ...(data.status === 'suspended'
              ? [{ href: '#community-host-status', label: 'Visibility', sectionId: 'community-host-status' }]
              : []),
            { href: '#community-cohosts', label: 'Co-hosts', sectionId: 'community-cohosts' },
            { href: '#community-host', label: 'Host', sectionId: 'community-host' },
          ]
        : []),
    ],
    [data.viewerIsHost, data.status]
  );

  const metaDescription =
    data.summary?.slice(0, 160) ??
    data.description?.slice(0, 160) ??
    `Find your people with ${data.name} on UAE Trail`;

  const onJoin = () => {
    if (!user) {
      navigate(joinAuthPath(publicPath));
      return;
    }
    if (joinMutation.isPending || !canJoin) return;
    joinMutation.mutate(data.id);
  };

  const onLeave = () => {
    if (!user || leaveMutation.isPending || !membershipStatus) return;
    leaveMutation.mutate(data.id);
  };

  const joinLabel = communityJoinCtaLabel({
    joinPolicy: data.joinPolicy,
    canAcceptInvite,
  });

  const membershipChip = isMember ? (
    <span className="rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
      {COMMUNITY_MEMBERSHIP_JOINED_LABEL}
    </span>
  ) : isPending ? (
    <span className="rounded-full bg-amber-400/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-950">
      {COMMUNITY_MEMBERSHIP_REQUESTED_LABEL}
    </span>
  ) : null;

  const primaryCta = isMember ? (
    <div className="flex w-full flex-col gap-2 lg:w-auto">
      <span
        className="block w-full rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-bold text-white lg:inline-block"
        aria-live="polite"
      >
        {COMMUNITY_MEMBERSHIP_JOINED_LABEL}
      </span>
      <button
        type="button"
        onClick={onLeave}
        disabled={leaveMutation.isPending}
        className={`${EXPLORE_PEEK_CTA.secondary} w-full`}
      >
        {leaveMutation.isPending ? 'Leaving…' : 'Leave'}
      </button>
    </div>
  ) : isPending ? (
    <span
      className="block w-full rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-950 ring-1 ring-amber-200/90 lg:inline-block lg:w-auto"
      aria-live="polite"
    >
      {COMMUNITY_MEMBERSHIP_REQUESTED_LABEL}
    </span>
  ) : canJoin ? (
    <button
      type="button"
      onClick={onJoin}
      disabled={joinMutation.isPending}
      className={`${EXPLORE_PEEK_CTA.primary} w-full lg:w-auto`}
    >
      {joinMutation.isPending ? 'Sending…' : joinLabel}
    </button>
  ) : (
    <span className="block text-center text-sm text-neutral-600 lg:text-start">
      Invite-only — ask the host for an invite.
    </span>
  );

  const footer = (
    <div className="space-y-2">
      {primaryCta}
      {joinMutation.isError ? (
        <p className="text-center text-sm text-red-600 lg:text-start">Could not join. Try again.</p>
      ) : null}
      {leaveMutation.isError ? (
        <p className="text-center text-sm text-red-600 lg:text-start">Could not leave. Try again.</p>
      ) : null}
    </div>
  );

  const heroChips = (
    <ChipRow>
      {membershipChip}
      <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/25">
        {communityJoinPolicyLabel(data.joinPolicy)}
      </span>
      <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/25">
        {data.memberCount} member{data.memberCount === 1 ? '' : 's'}
      </span>
    </ChipRow>
  );

  return (
    <>
      <PageMeta
        title={data.name}
        description={metaDescription}
        path={publicPath}
        image={data.bannerUrl ?? undefined}
        imageAlt={data.name}
      />

      <DetailPageShell
        backTo={mapBack}
        backLabel="Crews"
        headerChrome={{ emoji: '🏕️', label: 'Community' }}
        headerAction={<ShareButton path={publicPath} title={data.name} compact />}
        hero={
          <HeroBanner
            imageUrl={data.bannerUrl}
            title={data.name}
            subtitle={<span className="text-sm font-medium text-white/90">{geoEyebrow(data)}</span>}
            chips={heroChips}
            typeBadge={
              <span className="rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Community
              </span>
            }
            topEndAction={<ShareButton path={publicPath} title={data.name} compact />}
          />
        }
        jumpRow={<ConsumerDetailSectionJumpNav links={jumpLinks} />}
        keyFacts={
          <StatGrid>
            <StatTile
              icon={<Users className="h-4 w-4" aria-hidden />}
              label="Members"
              value={String(data.memberCount)}
              showWhenEmpty
            />
            <StatTile
              icon={<CalendarDays className="h-4 w-4" aria-hidden />}
              label="Join"
              value={communityJoinPolicyLabel(data.joinPolicy)}
            />
          </StatGrid>
        }
        footer={footer}
        aside={
          isMember ? (
            <SectionCard title="You're in" tone="emerald">
              <p className="text-sm text-neutral-700">
                You&apos;ll see community outings here when hosts publish them on the map.
              </p>
            </SectionCard>
          ) : undefined
        }
      >
        <ConsumerDetailSection id="community-about" title="About" tone="emerald" collapsible defaultExpanded>
          {data.summary ? <p className="text-base font-medium text-neutral-900">{data.summary}</p> : null}
          {data.description ? (
            <p className={`text-sm leading-relaxed text-neutral-700 ${data.summary ? 'mt-3' : ''} whitespace-pre-wrap`}>
              {data.description}
            </p>
          ) : !data.summary ? (
            <p className="text-sm text-neutral-600">This community hasn&apos;t added an about section yet.</p>
          ) : null}
        </ConsumerDetailSection>

        <ConsumerDetailSection id="community-policies" title="Policies" tone="neutral" collapsible defaultExpanded>
          {data.policies ? (
            <p className="text-sm leading-relaxed text-neutral-700 whitespace-pre-wrap">{data.policies}</p>
          ) : (
            <p className="text-sm text-neutral-600">House rules and expectations will appear here when the host adds them.</p>
          )}
        </ConsumerDetailSection>

        <ConsumerDetailSection id="community-outings" title="Outings" tone="slate" collapsible defaultExpanded>
          <CommunityOutingsSection
            isLoading={outingsQuery.isPending}
            upcoming={outingsQuery.data?.upcoming ?? []}
            past={outingsQuery.data?.past ?? []}
          />
        </ConsumerDetailSection>

        {data.viewerIsHost ? (
          <CommunityHostManageSection
            communityId={data.id}
            slug={data.slug}
            joinPolicy={data.joinPolicy}
          />
        ) : null}

        {data.viewerIsHost ? (
          <CommunityHostEditSection
            data={data}
            onSave={(input) => patchMutation.mutate(input)}
            isSaving={patchMutation.isPending}
            saveError={patchMutation.isError}
            onLinkActivity={(activityId) =>
              linkActivityMutation.mutate({ communityId: data.id, activityId })
            }
            isLinking={linkActivityMutation.isPending}
            linkError={linkActivityMutation.isError}
          />
        ) : null}
      </DetailPageShell>
    </>
  );
};

const CommunityOutingsSection = ({
  isLoading,
  upcoming,
  past,
}: {
  isLoading: boolean;
  upcoming: ActivityDTO[];
  past: ActivityDTO[];
}) => {
  if (isLoading) {
    return <p className="text-sm text-neutral-600">Loading outings…</p>;
  }
  const hasAny = upcoming.length > 0 || past.length > 0;
  if (!hasAny) {
    return (
      <CommunityOutingsEmpty
        title={COMMUNITY_OUTINGS_EMPTY_TITLE}
        body={COMMUNITY_OUTINGS_EMPTY_BODY}
      />
    );
  }
  return (
    <div className="space-y-6">
      {upcoming.length ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Upcoming</p>
          <ul className="space-y-2">
            {upcoming.map((activity) => (
              <li key={activity.id}>
                <ProfileActivityListRow activity={activity} variant="plain" />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {past.length ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Past</p>
          <ul className="space-y-2">
            {past.map((activity) => (
              <li key={activity.id}>
                <ProfileActivityListRow activity={activity} variant="plain" />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

const CommunityOutingsEmpty = ({ title, body }: { title: string; body: string }) => (
  <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-6 text-center">
    <p className="text-sm font-semibold text-neutral-900">{title}</p>
    <p className="mt-2 text-sm text-neutral-600">{body}</p>
  </div>
);

const CommunityHostEditSection = ({
  data,
  onSave,
  isSaving,
  saveError,
  onLinkActivity,
  isLinking,
  linkError,
}: {
  data: CommunityDiscoverDetailDTO;
  onSave: (input: { communityId: string; patch: CommunityHostProfilePatchDTO }) => void;
  isSaving: boolean;
  saveError: boolean;
  onLinkActivity: (activityId: string) => void;
  isLinking: boolean;
  linkError: boolean;
}) => {
  const [summary, setSummary] = useState(data.summary ?? '');
  const [description, setDescription] = useState(data.description ?? '');
  const [policies, setPolicies] = useState(data.policies ?? '');
  const [bannerUrl, setBannerUrl] = useState(data.bannerUrl ?? '');
  const [linkActivityId, setLinkActivityId] = useState('');

  return (
    <ConsumerDetailSection
      id="community-host"
      title="Host"
      tone="amber"
      collapsible
      defaultExpanded={false}
      action={
        <button
          type="button"
          disabled={isSaving}
          onClick={() =>
            onSave({
              communityId: data.id,
              patch: {
                summary: summary.trim() || null,
                description: description.trim() || null,
                policies: policies.trim() || null,
                bannerUrl: bannerUrl.trim() || null,
              },
            })
          }
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      }
    >
      <p className="mb-4 text-sm text-neutral-600">Update how your community shows up — no admin console needed.</p>
      <div className="space-y-4">
        <label className="block text-sm font-medium text-neutral-800">
          Short summary
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-neutral-800">
          About
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-neutral-800">
          Policies
          <textarea
            value={policies}
            onChange={(e) => setPolicies(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-neutral-800">
          Banner image URL
          <input
            type="url"
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
          />
        </label>
        <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 px-3 py-3">
          <p className="text-sm font-medium text-neutral-900">Link a published outing</p>
          <p className="mt-1 text-xs text-neutral-600">
            Paste an activity id from a published plan you host — it will show under Outings.
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={linkActivityId}
              onChange={(e) => setLinkActivityId(e.target.value)}
              placeholder="Activity id"
              className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={isLinking || !linkActivityId.trim()}
              onClick={() => {
                onLinkActivity(linkActivityId.trim());
                setLinkActivityId('');
              }}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isLinking ? 'Linking…' : 'Link outing'}
            </button>
          </div>
          {linkError ? <p className="mt-2 text-sm text-red-600">Could not link outing.</p> : null}
        </div>
      </div>
      {saveError ? <p className="mt-3 text-sm text-red-600">Could not save. Try again.</p> : null}
    </ConsumerDetailSection>
  );
};