import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Download, Loader2, Lock } from 'lucide-react';
import type { LocationPremiumSummaryDTO, PremiumAccessReason } from '@uaetrail/shared-types';
import { signInPath } from '../../config/routingCatalog';
import { useAuth } from '../../context/AuthContext';
import {
  downloadPlaceGuidePdfFile,
  downloadPlaceRouteMapFile,
  fetchPlaceGuideMarkdown,
  startPlacePremiumCheckout,
} from '../../hooks/placePremiumApi';
import { AppButton } from '../mobile/AppButton';

const triggerBlobDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const premiumAccessLabel = (reason: PremiumAccessReason): string => {
  switch (reason) {
    case 'pro':
      return 'Included with Pro membership';
    case 'goat':
      return 'Included with GOAT membership';
    case 'admin':
      return 'Admin access';
    case 'unlocked':
      return 'Unlocked for this place';
    default:
      return '';
  }
};

const accentLinkClass = (accent: 'emerald' | 'amber' | 'violet') => {
  if (accent === 'amber') return 'text-amber-700 hover:text-amber-800';
  if (accent === 'violet') return 'text-violet-700 hover:text-violet-800';
  return 'text-emerald-700 hover:text-emerald-800';
};

export type PlacePremiumGuidePanelProps = {
  placeId: string;
  placeName: string;
  premium?: LocationPremiumSummaryDTO | null;
  onPremiumChange?: (premium: LocationPremiumSummaryDTO) => void;
  unlockNotice?: string | null;
  onDismissUnlockNotice?: () => void;
  accent?: 'emerald' | 'amber' | 'violet';
  /** When true, load guide markdown as soon as unlocked (consumer scroll). */
  loadGuideWhenUnlocked?: boolean;
};

export const PlacePremiumGuidePanel = ({
  placeId,
  placeName,
  premium,
  onPremiumChange,
  unlockNotice,
  onDismissUnlockNotice,
  accent = 'emerald',
  loadGuideWhenUnlocked = true,
}: PlacePremiumGuidePanelProps) => {
  const [guideMarkdown, setGuideMarkdown] = useState<string | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [guideError, setGuideError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [mapDownloading, setMapDownloading] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();
  const linkClass = accentLinkClass(accent);
  const hasPremiumContent = Boolean(premium?.hasPremium);
  const isPremiumUnlocked = Boolean(premium?.isUnlocked);
  const signInHref = signInPath({ redirect: pathname });

  useEffect(() => {
    if (!loadGuideWhenUnlocked || !placeId || !isPremiumUnlocked || !premium?.hasGuide) {
      return;
    }

    let cancelled = false;
    setGuideLoading(true);
    setGuideError(null);

    fetchPlaceGuideMarkdown(placeId)
      .then((markdown) => {
        if (!cancelled) setGuideMarkdown(markdown);
      })
      .catch((err) => {
        if (!cancelled) {
          setGuideError(err instanceof Error ? err.message : 'Could not load guide');
        }
      })
      .finally(() => {
        if (!cancelled) setGuideLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadGuideWhenUnlocked, placeId, isPremiumUnlocked, premium?.hasGuide]);

  const handleUnlock = async () => {
    if (!user) return;
    setCheckoutLoading(true);
    setActionError(null);
    try {
      const checkout = await startPlacePremiumCheckout(placeId);
      if (checkout.url) {
        window.location.href = checkout.url;
        return;
      }
      if (checkout.premium && onPremiumChange) {
        onPremiumChange(checkout.premium);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleDownloadRouteMap = async () => {
    setMapDownloading(true);
    setActionError(null);
    try {
      const { blob, filename } = await downloadPlaceRouteMapFile(placeId);
      triggerBlobDownload(blob, filename);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Route map download failed');
    } finally {
      setMapDownloading(false);
    }
  };

  const handleDownloadGuidePdf = async () => {
    setPdfDownloading(true);
    setActionError(null);
    try {
      const { blob, filename } = await downloadPlaceGuidePdfFile(placeId);
      triggerBlobDownload(blob, filename);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Guide PDF download failed');
    } finally {
      setPdfDownloading(false);
    }
  };

  const unlockPriceLabel =
    premium && premium.unlockPriceAed > 0
      ? `Unlock for AED ${premium.unlockPriceAed}`
      : 'Unlock free guide';

  return (
    <div className="space-y-4">
      {unlockNotice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 flex items-start justify-between gap-3">
          <p>{unlockNotice}</p>
          {onDismissUnlockNotice ? (
            <button
              type="button"
              onClick={onDismissUnlockNotice}
              className="shrink-0 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            >
              Dismiss
            </button>
          ) : null}
        </div>
      ) : null}

      {!hasPremiumContent ? (
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-6 py-10 text-center">
          <h3 className="text-base font-semibold text-neutral-900">Guided information</h3>
          <p className="text-sm text-neutral-600 mt-2 max-w-md mx-auto leading-relaxed">
            No premium route map or guide has been published for {placeName} yet.
          </p>
        </div>
      ) : !user ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Lock className="h-7 w-7" strokeWidth={2} aria-hidden />
          </div>
          <p className="text-sm text-neutral-600 leading-relaxed max-w-sm mx-auto">
            <Link to={signInHref} className={`font-bold ${linkClass}`}>
              Sign in
            </Link>{' '}
            to preview and unlock route maps and guides for this place.
          </p>
        </div>
      ) : isPremiumUnlocked ? (
        <>
          {premium?.accessReason && premium.accessReason !== 'locked' ? (
            <p className="text-xs font-medium text-emerald-700">{premiumAccessLabel(premium.accessReason)}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {premium?.hasRouteMap ? (
              <AppButton
                type="button"
                variant="secondary"
                onClick={handleDownloadRouteMap}
                disabled={mapDownloading}
                className="inline-flex items-center gap-2"
              >
                {mapDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download route map
              </AppButton>
            ) : null}
            {premium?.hasGuidePdf ? (
              <AppButton
                type="button"
                variant="secondary"
                onClick={handleDownloadGuidePdf}
                disabled={pdfDownloading}
                className="inline-flex items-center gap-2"
              >
                {pdfDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download guide PDF
              </AppButton>
            ) : null}
          </div>

          {guideLoading ? (
            <div className="flex items-center justify-center py-10 text-neutral-500">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading guide…
            </div>
          ) : guideError ? (
            <p className="text-sm text-red-600">{guideError}</p>
          ) : guideMarkdown?.trim() ? (
            <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4">
              <h3 className="text-sm font-semibold text-neutral-900 mb-3">Trail guide</h3>
              <div className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{guideMarkdown}</div>
            </div>
          ) : premium?.hasGuide ? (
            <p className="text-sm text-neutral-500">Guide content is not available right now.</p>
          ) : null}
        </>
      ) : (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-6 py-8">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Lock className="h-5 w-5" aria-hidden />
            </div>
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Unlock guided information</h3>
                <p className="text-sm text-neutral-600 mt-1 leading-relaxed">
                  Get the GPX route map and full guide for {placeName}.
                  {premium?.unlockPriceAed === 0
                    ? ' This guide is free once you unlock it.'
                    : ' Pro and GOAT members get access included.'}
                </p>
              </div>

              {premium?.guidePreview ? (
                <p className="text-sm text-neutral-700 italic border-l-2 border-amber-300 pl-3">{premium.guidePreview}</p>
              ) : null}

              <AppButton type="button" onClick={handleUnlock} disabled={checkoutLoading} className="inline-flex items-center gap-2">
                {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {unlockPriceLabel}
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
    </div>
  );
};
