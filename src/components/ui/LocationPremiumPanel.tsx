import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Download,
  Lock,
  Navigation,
  Phone,
  Shield,
  Sparkles,
  Tent,
  Unlock,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ActivityType, LocationPremiumSummaryDTO, LocationGuideDTO } from '@uaetrail/shared-types';
import { api } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { FEATURE_FLAGS } from '../../config/platform';

interface LocationPremiumPanelProps {
  locationId: string;
  locationName: string;
  activityType: ActivityType;
  premium: LocationPremiumSummaryDTO | null;
  onPremiumChange?: (premium: LocationPremiumSummaryDTO) => void;
  accent?: 'emerald' | 'amber';
  /** Tab embed: minimal UI until the user chooses to get access. */
  variant?: 'embedded' | 'standalone';
}

const triggerBrowserDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const premiumCopy = (activityType: ActivityType, locationName: string) => {
  if (activityType === 'camping') {
    return {
      title: 'Guided information',
      subtitle: `Detailed setup, access, and overnight tips for ${locationName}`,
      summary:
        'Optional add-on: full camp guide with access notes, overnight checklist, and guide-on-call for your stay.',
      paygDetail:
        'Unlock the complete camp guide for this location — access tracks, shelter notes, and on-call support.',
      membershipDetail: 'Pro & GOAT members get guides for all locations.',
      routeMapLabel: null as string | null,
      guideLabel: 'Camp guide',
    };
  }

  return {
    title: 'Guided information',
    subtitle: `GPX route track and in-depth trail notes for ${locationName}`,
    summary:
      'Optional add-on: downloadable hiking route (GPX) plus a detailed trail guide and guide-on-call for your hike.',
    paygDetail:
      'Unlock the GPX route for navigation apps, plus the full trail guide and guide-on-call for this hike.',
    membershipDetail: 'Pro & GOAT members get route maps and guides for all trails.',
    routeMapLabel: 'Download route (GPX)',
    guideLabel: 'Trail guide',
  };
};

/** Paid route map + guide — shown only in the Guide tab when the user asks for access. */
export const LocationPremiumPanel = ({
  locationId,
  locationName,
  activityType,
  premium,
  onPremiumChange,
  accent = 'emerald',
  variant = 'embedded',
}: LocationPremiumPanelProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const copy = premiumCopy(activityType, locationName);
  const isHiking = activityType === 'hiking';
  const embedded = variant === 'embedded';

  const [localPremium, setLocalPremium] = useState(premium);
  const [guide, setGuide] = useState<LocationGuideDTO | null>(null);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [downloadingMap, setDownloadingMap] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [guideExpanded, setGuideExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessStep, setAccessStep] = useState<'idle' | 'choose' | 'payg'>('idle');

  useEffect(() => {
    setLocalPremium(premium);
    if (premium?.isUnlocked) {
      setAccessStep('idle');
    }
  }, [premium]);

  const accentBtn =
    accent === 'amber'
      ? 'bg-amber-600 hover:bg-amber-700 text-white'
      : 'bg-emerald-600 hover:bg-emerald-700 text-white';
  const accentText = accent === 'amber' ? 'text-amber-700' : 'text-emerald-700';
  const accentBg = accent === 'amber' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200';

  const updatePremium = useCallback(
    (next: LocationPremiumSummaryDTO) => {
      setLocalPremium(next);
      onPremiumChange?.(next);
    },
    [onPremiumChange]
  );

  const loadGuide = useCallback(async () => {
    if (!localPremium?.isUnlocked) return;
    setLoadingGuide(true);
    setError(null);
    try {
      const res = await api.getLocationGuide(locationId);
      setGuide(res.data);
      setGuideExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load guide');
    } finally {
      setLoadingGuide(false);
    }
  }, [locationId, localPremium?.isUnlocked]);

  useEffect(() => {
    if (localPremium?.isUnlocked && localPremium.hasGuide && !guide) {
      void loadGuide();
    }
  }, [localPremium?.isUnlocked, localPremium?.hasGuide, guide, loadGuide]);

  if (!localPremium?.hasPremium) return null;

  const showRouteMap = isHiking && localPremium.hasRouteMap;

  const handleUnlock = async () => {
    if (!user) {
      navigate(`/signin?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setUnlocking(true);
    setError(null);
    try {
      const res = await api.checkoutLocationPremium(locationId);
      if (res.data.url) {
        window.location.href = res.data.url;
        return;
      }
      if (res.data.premium) {
        updatePremium(res.data.premium);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unlock failed');
    } finally {
      setUnlocking(false);
    }
  };

  const handleDownloadMap = async () => {
    if (!localPremium.isUnlocked || !showRouteMap) return;
    setDownloadingMap(true);
    setError(null);
    try {
      const { blob, filename } = await api.downloadLocationRouteMap(locationId);
      triggerBrowserDownload(blob, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloadingMap(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!localPremium.isUnlocked) return;
    setDownloadingPdf(true);
    setError(null);
    try {
      const { blob, filename } = await api.downloadLocationGuidePdf(locationId);
      triggerBrowserDownload(blob, filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF download failed');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const tierLabel =
    localPremium.accessReason === 'pro'
      ? 'Included with Pro'
      : localPremium.accessReason === 'goat'
        ? 'Included with GOAT'
        : localPremium.accessReason === 'unlocked'
          ? 'Unlocked for this location'
          : null;

  const HeaderIcon = isHiking ? Navigation : Tent;

  const unlockedContent = (
    <div className="space-y-3">
      <div
        className={`grid gap-3 ${showRouteMap && localPremium.hasGuidePdf ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}
      >
        {showRouteMap && (
          <button
            type="button"
            onClick={() => void handleDownloadMap()}
            disabled={downloadingMap}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-colors ${accentBtn} disabled:opacity-60`}
          >
            {downloadingMap ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {copy.routeMapLabel}
          </button>
        )}
        {localPremium.hasGuidePdf && (
          <button
            type="button"
            onClick={() => void handleDownloadPdf()}
            disabled={downloadingPdf}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-white border border-gray-200 text-gray-800 hover:bg-gray-50 disabled:opacity-60"
          >
            {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download guide PDF
          </button>
        )}
      </div>

      {localPremium.hasGuide && (
        <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => (guide ? setGuideExpanded((v) => !v) : void loadGuide())}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
              <BookOpen className={`w-4 h-4 ${accentText}`} />
              {copy.guideLabel}
            </span>
            {loadingGuide ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            ) : guideExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {guideExpanded && guide?.markdown && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <div className="prose prose-sm max-w-none text-gray-700 mt-3 whitespace-pre-wrap leading-relaxed">
                {guide.markdown}
              </div>
              <p className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <Phone className="w-3.5 h-3.5" />
                Guide on call included for this {isHiking ? 'hike' : 'camp'}.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const lockedContent = (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600 leading-relaxed">{copy.summary}</p>

      {localPremium.guidePreview && (
        <p className="text-sm text-neutral-500 leading-relaxed border-l-2 border-neutral-200 pl-3">
          {localPremium.guidePreview}
        </p>
      )}

      {accessStep === 'idle' && (
        <button
          type="button"
          onClick={() => setAccessStep('choose')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${accentBtn}`}
        >
          <Unlock className="w-4 h-4" />
          Get access
        </button>
      )}

      {accessStep === 'choose' && (
        <div className={`grid grid-cols-1 ${FEATURE_FLAGS.membershipEnabled ? 'sm:grid-cols-2' : ''} gap-3`}>
          {FEATURE_FLAGS.membershipEnabled && (
            <Link
              to="/membership"
              className="group flex flex-col gap-2 p-4 rounded-xl bg-white border border-gray-200 hover:border-amber-300 hover:shadow-sm transition-all text-left"
            >
              <span className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                Upgrade membership
              </span>
              <span className="text-xs text-gray-500 leading-relaxed">{copy.membershipDetail}</span>
              <span className={`text-xs font-semibold mt-auto ${accentText}`}>See plans →</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setAccessStep('payg')}
            className="group flex flex-col gap-2 p-4 rounded-xl bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-sm transition-all text-left"
          >
            <span className="flex items-center gap-2 font-bold text-gray-900 text-sm">
              <Lock className={`w-4 h-4 shrink-0 ${accentText}`} />
              Pay as you go
            </span>
            <span className="text-xs text-gray-500 leading-relaxed">
              {isHiking ? 'Unlock this trail only.' : 'Unlock this camp only.'}
            </span>
            <span className={`text-xs font-semibold mt-auto ${accentText}`}>Continue →</span>
          </button>
        </div>
      )}

      {accessStep === 'payg' && (
        <div className="rounded-xl bg-white border border-gray-100 p-4 space-y-3">
          <button
            type="button"
            onClick={() => setAccessStep('choose')}
            className="text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            ← Back to options
          </button>
          <p className="text-sm text-gray-700 leading-relaxed">{copy.paygDetail}</p>
          <button
            type="button"
            onClick={() => void handleUnlock()}
            disabled={unlocking}
            className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm transition-colors ${accentBtn} disabled:opacity-60`}
          >
            {unlocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
            Unlock {isHiking ? 'this trail' : 'this camp'}
          </button>
          <p className="text-center text-xs text-gray-500">
            Prefer unlimited access?{' '}
            <Link to="/membership" className={`font-semibold ${accentText} hover:underline`}>
              Compare membership plans
            </Link>
          </p>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className="py-6 mt-4 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-neutral-900">{copy.title}</h3>
          <p className="text-sm text-neutral-500 mt-1">{copy.subtitle}</p>
          {tierLabel && localPremium.isUnlocked && (
            <p className={`text-xs font-semibold mt-2 flex items-center gap-1 ${accentText}`}>
              <Shield className="w-3.5 h-3.5" />
              {tierLabel}
            </p>
          )}
        </div>
        {localPremium.isUnlocked ? unlockedContent : lockedContent}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <section className={`rounded-2xl border p-5 md:p-6 ${accentBg}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accentBtn}`}>
          <HeaderIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-900">{copy.title}</h2>
          <p className="text-sm text-gray-600 mt-0.5">{copy.subtitle}</p>
          {tierLabel && localPremium.isUnlocked && (
            <p className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${accentText}`}>
              <Shield className="w-3.5 h-3.5" />
              {tierLabel}
            </p>
          )}
        </div>
      </div>
      {localPremium.isUnlocked ? unlockedContent : lockedContent}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
};
