import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { api } from '../api/index';
import { exploreShopsPath } from '../config/routingCatalog';
import { shopPublicPath } from '../utils/shopPaths';
import { PageMeta } from '../components/seo/PageMeta';

/** Legacy product URLs — redirect to outbound link or the shop page. */
export const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<{ kind: 'loading' } | { kind: 'external'; url: string } | { kind: 'shop'; merchantId: string } | { kind: 'missing' }>({ kind: 'loading' });

  useEffect(() => {
    if (!id) {
      setState({ kind: 'missing' });
      return;
    }
    api
      .getShopProductDetail(id)
      .then((res) => {
        const external = res.data.externalUrl?.trim();
        if (external) {
          window.location.replace(external);
          setState({ kind: 'external', url: external });
          return;
        }
        setState({ kind: 'shop', merchantId: res.data.merchantId });
      })
      .catch(() => setState({ kind: 'missing' }));
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
