import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import {
  hostBrandProfilePath,
  inferHostStorefrontKindFromTenantWire,
  shopPublicPath,
} from '@uaetrail/shared-types';
import { fetchOrganisationProfileBySlug } from '../hooks/organisationConsoleApi';

/** Permanent redirect from retired `/operator/:slug` to `/guide`, `/agency`, `/partner`, or `/shop`. */
export const LegacyOperatorProfileRedirect = () => {
  const { id: slug } = useParams<{ id: string }>();
  const [target, setTarget] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetchOrganisationProfileBySlug(slug)
      .then((tenant) => {
        if (cancelled) return;
        if (tenant.businessMode === 'SHOP' || tenant.type === 'shop' || tenant.type === 'SHOP') {
          setTarget(shopPublicPath({ slug: tenant.slug ?? slug }));
          return;
        }
        const kind = inferHostStorefrontKindFromTenantWire({
          type: tenant.type,
          businessMode: tenant.businessMode,
        });
        setTarget(hostBrandProfilePath(tenant.slug ?? slug, kind) ?? '/explore');
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!slug) return <Navigate to="/explore" replace />;
  if (failed) return <Navigate to="/explore" replace />;
  if (!target) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-emerald-600" />
      </div>
    );
  }
  return <Navigate to={target} replace />;
};
