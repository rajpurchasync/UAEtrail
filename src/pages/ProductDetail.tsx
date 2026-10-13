import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { fetchShopProductDetail } from '../hooks/shopPublicClientApi';
import { exploreShopsPath } from '../config/routingCatalog';
import { shopPublicPath } from '../utils/shopPaths';
import { PageMeta } from '../components/seo/PageMeta';
import { useSafeAsyncEffect } from '../hooks/useSafeAsyncEffect';

/** Legacy product URLs — redirect to outbound link or the shop page. */
export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'external'; url: string }
    | { kind: 'shop'; merchantId: string }
    | { kind: 'missing' }
  >({ kind: 'loading' });

  useSafeAsyncEffect(async (isActive) => {
    if (!id) {
      if (isActive()) {
        setState({ kind: 'missing' });
      }
      return;
    }
    try {
      const product = await fetchShopProductDetail(id);
      if (!isActive()) return;
      const external = product.externalUrl?.trim();
      if (external) {
        window.location.replace(external);
        setState({ kind: 'external', url: external });
        return;
      }
      const merchantId = product.merchantId ?? product.merchant?.id;
      if (!merchantId) {
        setState({ kind: 'missing' });
        return;
      }
      setState({ kind: 'shop', merchantId });
    } catch {
      if (isActive()) {
        setState({ kind: 'missing' });
      }
    }
  }, [id]);

  if (state.kind === 'loading') {
    return (
      <>
        <PageMeta title="Loading" path={id ? `/product/${id}` : undefined} noIndex />
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-emerald-600" />
        </div>
      </>
    );
  }

  if (state.kind === 'shop') {
    return <Navigate to={shopPublicPath({ merchantId: state.merchantId })} replace />;
  }

  if (state.kind === 'external') {
    return (
      <>
        <PageMeta title="Opening shop" noIndex path={id ? `/product/${id}` : undefined} />
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center">
          <p className="text-sm text-gray-600">Opening partner shop…</p>
          <a href={state.url} className="text-sm font-semibold text-emerald-700">
            Continue if you are not redirected
          </a>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Product not found" noIndex path={id ? `/product/${id}` : undefined} />
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <Link to={exploreShopsPath()} className="font-medium text-emerald-600">
          Back to explore
        </Link>
      </div>
    </>
  );
};
