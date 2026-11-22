import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ConsumerShell } from '@/components/mobile/ConsumerShell';
import { PageMeta } from '@/components/seo/PageMeta';
import { FEATURE_FLAGS } from '@/config/platform';
import { communityClubPath, EXPLORE_MAP_PATH, joinAuthPath } from '@/config/routingCatalog';
import {
  useCommunityDiscoverDetail,
  useJoinDiscoverableCommunity,
} from '@/crew-discovery/hooks/useCommunityDiscoverDetail';
import { useAuth } from '@/context/AuthContext';

export const CommunityClubDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isPending, error } = useCommunityDiscoverDetail(slug, true);
  const joinMutation = useJoinDiscoverableCommunity(slug);

  if (!FEATURE_FLAGS.communityDiscover) {
    return (
      <ConsumerShell layout="stack" title="Community" showJourney={false} back={{ fallbackTo: EXPLORE_MAP_PATH }}>
        <p className="text-sm text-neutral-600">Community discover is not enabled yet.</p>
      </ConsumerShell>
    );
  }

  if (isPending) {
    return (
      <ConsumerShell layout="stack" title="Community" showJourney={false} back={{ fallbackTo: EXPLORE_MAP_PATH }}>
        <CommunityDetailLoading />
      </ConsumerShell>
    );
  }

  if (error || !data) {
    return (
      <ConsumerShell layout="stack" title="Community" showJourney={false} back={{ fallbackTo: EXPLORE_MAP_PATH }}>
        <p className="text-sm text-red-600">This community could not be found.</p>
      </ConsumerShell>
    );
  }

  const membershipStatus = data.viewerMembership?.status;
  const isMember = membershipStatus === 'member';
  const isPending = membershipStatus === 'pending';
  const canJoinOpen = data.joinPolicy === 'open' && !membershipStatus;
  const canRequestJoin = data.joinPolicy === 'request' && !membershipStatus;

  const onJoin = () => {
    if (!user) {
      navigate(joinAuthPath(communityClubPath(data.slug)));
      return;
    }
    if (joinMutation.isPending) return;
    if (!canJoinOpen && !canRequestJoin) return;
    joinMutation.mutate(data.id);
  };

  return (
    <>
      <PageMeta title={data.name} description={data.summary ?? `Discover ${data.name} on UAE Trail`} path={communityClubPath(data.slug)} />
      <ConsumerShell layout="stack" title={data.name} showJourney={false} back={{ fallbackTo: EXPLORE_MAP_PATH }}>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {data.geoRef.names.country}
          {data.geoRef.names.area ? ` · ${data.geoRef.names.area}` : ''}
        </p>
        {data.summary ? <p className="mt-3 text-sm leading-relaxed text-neutral-700">{data.summary}</p> : null}
        <p className="mt-4 text-xs text-neutral-500">
          {data.memberCount} member{data.memberCount === 1 ? '' : 's'} · Join: {data.joinPolicy}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {isMember ? (
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
              You&apos;re a member
            </span>
          ) : isPending ? (
            <span className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 ring-1 ring-amber-200">
              Request pending — the host will review soon
            </span>
          ) : canJoinOpen || canRequestJoin ? (
            <button
              type="button"
              onClick={onJoin}
              disabled={joinMutation.isPending}
              className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {joinMutation.isPending
                ? 'Sending…'
                : canRequestJoin
                  ? 'Request to join'
                  : 'Join community'}
            </button>
          ) : (
            <span className="text-sm text-neutral-600">Invite-only community.</span>
          )}
          <Link
            to={EXPLORE_MAP_PATH}
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"
          >
            Back to map
          </Link>
        </div>

        {joinMutation.isError ? (
          <p className="mt-3 text-sm text-red-600">Could not join. Try again in a moment.</p>
        ) : null}
      </ConsumerShell>
    </>
  );
};

const CommunityDetailLoading = () => (
  <div className="flex justify-center py-12" aria-busy>
    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-hidden />
  </div>
);