import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageMeta } from '../components/seo/PageMeta';
import { ShopPublicPage } from '../components/shop/ShopPublicPage';
import { explorePath } from '../config/routingCatalog';
import { shopPublicPath } from '../utils/shopPaths';
import { shopPublicPageQueryKey } from '../hooks/clientQueryKeys';
import {
  fetchShopPublicPage,
  shopPublicPeekRedirectPath,
} from '../hooks/shopPublicClientApi';
import { DetailPageLoadingState } from '../components/ui/DetailPageLoadingState';
import { DETAIL_LOADING_SHOP } from '../content/detailLoadingCopy';

/** Public gear shop — resolves merchant id or tenant slug to one page. */
export const ShopPublic = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const mapBack = explorePath({ panel: 'shops', filter: 'shops' });

  const { data, isLoading } = useQuery({
    queryKey: id ? shopPublicPageQueryKey(id) : ['shop-public-page', ''],
    queryFn: () => fetchShopPublicPage(id!),
    enabled: Boolean(id),
    staleTime: 60_000,
  });

  const shop = data?.shop ?? null;
  const communityPeekOnly = data?.communityPeekOnly ?? false;

  useEffect(() => {
    if (!communityPeekOnly || !id) return;
    navigate(shopPublicPeekRedirectPath(id), { replace: true });
  }, [communityPeekOnly, id, navigate]);

  if (!id || isLoading || communityPeekOnly) {
    return (
      <>
        <PageMeta title="Loading shop" path={id ? shopPublicPath({ id }) : undefined} />
        <DetailPageLoadingState label={DETAIL_LOADING_SHOP} accent="emerald" variant="page" />
      </>
    );
  }

  if (!shop) {
    return (
      <>
        <PageMeta title="Shop not found" noIndex path={shopPublicPath({ id })} />
        <div className="app-page-center">
          <Link to={mapBack} className="font-medium text-emerald-600">
            Back to explore
          </Link>
        </div>
      </>
    );
  }

  return <ShopPublicPage shop={shop} />;
};
