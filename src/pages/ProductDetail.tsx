import { useEffect, useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchShopProductDetail } from '../hooks/shopPublicClientApi';
import { shopProductDetailQueryKey } from '../hooks/clientQueryKeys';
import { exploreShopsPath } from '../config/routingCatalog';
import { shopPublicPath } from '../utils/shopPaths';
import { PageMeta } from '../components/seo/PageMeta';

/** Legacy product URLs — redirect to outbound link or the shop page. */
export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: id ? shopProductDetailQueryKey(id) : ['shop-product-detail', ''],
    queryFn: () => fetchShopProductDetail(id!),
    enabled: Boolean(id),
    staleTime: 60_000,
    retry: false,
  });

  const externalUrl = useMemo(() => product?.externalUrl?.trim() || null, [product]);
  const merchantId = useMemo(
    () => product?.merchantId ?? product?.merchant?.id ?? null,
    [product]
  );

  useEffect(() => {
    if (!externalUrl) return;
    window.location.replace(externalUrl);
  }, [externalUrl]);

  if (!id) {
    return (
      <>
        <PageMeta title="Product not found" noIndex />
        <div className="flex min-h-screen items-center justify-center p-4 text-center">
          <Link to={exploreShopsPath()} className="font-medium text-emerald-600">
            Back to explore
          </Link>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <PageMeta title="Loading" path={`/product/${id}`} noIndex />
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-emerald-600" />
        </div>
      </>
    );
  }

  if (externalUrl) {
    return (
      <>
        <PageMeta title="Opening shop" noIndex path={`/product/${id}`} />
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center">
          <p className="text-sm text-gray-600">Opening partner shop…</p>
          <a href={externalUrl} className="text-sm font-semibold text-emerald-700">
            Continue if you are not redirected
          </a>
        </div>
      </>
    );
  }

  if (merchantId) {
    return <Navigate to={shopPublicPath({ merchantId })} replace />;
  }

  if (isError || !product) {
    return (
      <>
        <PageMeta title="Product not found" noIndex path={`/product/${id}`} />
        <div className="flex min-h-screen items-center justify-center p-4 text-center">
          <Link to={exploreShopsPath()} className="font-medium text-emerald-600">
            Back to explore
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Product not found" noIndex path={`/product/${id}`} />
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <Link to={exploreShopsPath()} className="font-medium text-emerald-600">
          Back to explore
        </Link>
      </div>
    </>
  );
};
