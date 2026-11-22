import { useParams } from 'react-router-dom';
import { CommunityClubDetailView } from '@/components/community/CommunityClubDetailView';
import { ConsumerEntityDetailLoading } from '@/detail/shell';
import { PageMeta } from '@/components/seo/PageMeta';
import { FEATURE_FLAGS } from '@/config/platform';
import { communityClubPath, exploreCrewsPath } from '@/config/routingCatalog';
import { useCommunityDiscoverDetail } from '@/crew-discovery/hooks/useCommunityDiscoverDetail';
import { DetailPageShell } from '@/detail/shell';

export const CommunityClubDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data, isPending, error } = useCommunityDiscoverDetail(slug, true);

  if (!FEATURE_FLAGS.communityDiscover) {
    return (
      <>
        <PageMeta title="Community" noIndex path={slug ? communityClubPath(slug) : undefined} />
        <DetailPageShell backTo={exploreCrewsPath({ list: true })} backLabel="Crews" centerContent>
          <p className="text-sm text-neutral-600">Community discover is not enabled yet.</p>
        </DetailPageShell>
      </>
    );
  }

  if (isPending) {
    return <ConsumerEntityDetailLoading backTo={exploreCrewsPath({ list: true })} backLabel="Crews" label="Community" />;
  }

  if (error || !data) {
    return (
      <>
        <PageMeta title="Community not found" noIndex path={slug ? communityClubPath(slug) : undefined} />
        <DetailPageShell backTo={exploreCrewsPath({ list: true })} backLabel="Crews" centerContent>
          <p className="text-sm text-red-600">This community could not be found.</p>
        </DetailPageShell>
      </>
    );
  }

  return <CommunityClubDetailView data={data} />;
};