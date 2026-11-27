import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminAlertsSafetyData } from '../../hooks/useAdminAlertsSafetyData';
import { DashboardLayout } from '../../components/layout';
import { ADMIN_LINKS } from '../../constants';
import { ADMIN_FILTER_SELECT_CLASS, ADMIN_INPUT_CLASS, AppSelect } from '../../components/ui/AppSelect';
import { AdminFilterBar } from '../../components/admin/AdminFilterBar';
import type { AdminPlatformAlertDTO } from '@uaetrail/shared-types';
import {
  confirmAdminAmenityReport,
  createAdminPlatformAlert,
  expireAdminPlatformAlert,
  reviewAdminVerificationDocument,
} from '../../hooks/adminAlertsClientApi';

const SEVERITY = [
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
] as const;
const SCOPE = [
  { value: 'global', label: 'Global' },
  { value: 'region', label: 'Region' },
  { value: 'point', label: 'Point' },
] as const;

const BANNER_ACTIVE_OPTIONS = [
  { value: 'active' as const, label: 'Active' },
  { value: 'expired' as const, label: 'Expired' },
];

const VERIFICATION_STATUS_OPTIONS = [
  { value: 'pending' as const, label: 'Pending' },
  { value: 'submitted' as const, label: 'Submitted' },
  { value: 'accepted' as const, label: 'Accepted' },
  { value: 'rejected' as const, label: 'Rejected' },
];

type SafetyTab = 'banners' | 'amenity' | 'verification';

const TABS: Array<{ id: SafetyTab; label: string }> = [
  { id: 'banners', label: 'Banners' },
  { id: 'amenity', label: 'Amenity' },
  { id: 'verification', label: 'Verification' },
];

export const Alerts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: SafetyTab =
    tabParam === 'amenity' || tabParam === 'verification' || tabParam === 'banners' ? tabParam : 'banners';

  const {
    data: safetyData,
    error: loadError,
    refetch,
  } = useAdminAlertsSafetyData();
  const rows = useMemo(() => safetyData?.alerts ?? [], [safetyData?.alerts]);
  const reports = useMemo(() => safetyData?.amenityReports ?? [], [safetyData?.amenityReports]);
  const verification = useMemo(
    () => safetyData?.verificationDocuments ?? [],
    [safetyData?.verificationDocuments]
  );
  const [mutationError, setMutationError] = useState<string | null>(null);
  const error =
    mutationError ??
    (loadError instanceof Error ? loadError.message : loadError ? 'Failed to load alerts' : null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [severity, setSeverity] = useState<'info' | 'warning' | 'critical'>('warning');
  const [scope, setScope] = useState<'global' | 'region' | 'point'>('global');
  const [region, setRegion] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [bannerSearch, setBannerSearch] = useState('');
  const [bannerSeverity, setBannerSeverity] = useState('');
  const [bannerScope, setBannerScope] = useState('');
  const [bannerActive, setBannerActive] = useState('');
  const [amenitySearch, setAmenitySearch] = useState('');
  const [amenityStateFilter, setAmenityStateFilter] = useState('');
  const [verificationSearch, setVerificationSearch] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');

  const filteredBanners = useMemo(() => {
    return rows.filter((row) => {
      if (bannerSeverity && row.severity !== bannerSeverity) return false;
      if (bannerScope && row.scope !== bannerScope) return false;
      if (bannerActive === 'active' && !row.active) return false;
      if (bannerActive === 'expired' && row.active) return false;
      if (!bannerSearch.trim()) return true;
      const q = bannerSearch.trim().toLowerCase();
      return (
        row.title.toLowerCase().includes(q) ||
        row.body.toLowerCase().includes(q) ||
        (row.region ?? '').toLowerCase().includes(q)
      );
    });
  }, [rows, bannerSearch, bannerSeverity, bannerScope, bannerActive]);

  const amenityStateOptions = useMemo(() => {
    const values = [...new Set(reports.map((r) => r.amenityState))].sort();
    return values.map((value) => ({ value, label: value.replace(/_/g, ' ') }));
  }, [reports]);

  const filteredAmenity = useMemo(() => {
    return reports.filter((row) => {
      if (amenityStateFilter && row.amenityState !== amenityStateFilter) return false;
      if (!amenitySearch.trim()) return true;
      const q = amenitySearch.trim().toLowerCase();
      return (
        row.facilityId.toLowerCase().includes(q) ||
        (row.note ?? '').toLowerCase().includes(q) ||
        row.amenityState.toLowerCase().includes(q)
      );
    });
  }, [reports, amenitySearch, amenityStateFilter]);

  const filteredVerification = useMemo(() => {
    return verification.filter((row) => {
      if (verificationStatus && row.status !== verificationStatus) return false;
      if (!verificationSearch.trim()) return true;
      const q = verificationSearch.trim().toLowerCase();
      return (
        row.organizerId.toLowerCase().includes(q) ||
        row.docType.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q)
      );
    });
  }, [verification, verificationSearch, verificationStatus]);

  const setTab = (next: SafetyTab) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  const create = async () => {
    try {
      setMutationError(null);
      await createAdminPlatformAlert({
        title,
        body,
        severity: severity as AdminPlatformAlertDTO['severity'],
        scope: scope as AdminPlatformAlertDTO['scope'],
        region: region || null,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        linkUrl: linkUrl || null,
      });
      setTitle('');
      setBody('');
      await refetch();
    } catch (err) {
      setMutationError(err instanceof Error ? err.message : 'Create failed');
    }
  };

  return (
    <DashboardLayout title="Safety" links={ADMIN_LINKS}>
      <div className="space-y-5">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Safety</h2>
          <p className="text-sm text-neutral-500">Platform banners, amenity conditions, and host verification docs.</p>
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-1">
          {TABS.map((item) => {
            const active = tab === item.id;
            const count =
              item.id === 'amenity'
                ? reports.length
                : item.id === 'verification'
                  ? verification.filter((d) => d.status === 'pending' || d.status === 'submitted').length
                  : rows.filter((r) => r.active).length;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  active ? 'bg-emerald-50 text-emerald-800' : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {item.label}
                {count > 0 ? (
                  <span className="rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">{count}</span>
                ) : null}
              </button>
            );
          })}
        </div>

        {tab === 'banners' ? (
          <div className="space-y-5">
            <section className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-neutral-900">Create platform alert</h3>
              <input className={ADMIN_INPUT_CLASS} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
              <textarea className={ADMIN_INPUT_CLASS} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" rows={3} />
              <div className="grid gap-3 md:grid-cols-2">
                <AppSelect value={severity} onChange={(v) => setSeverity(v)} options={SEVERITY} />
                <AppSelect value={scope} onChange={(v) => setScope(v)} options={SCOPE} />
              </div>
              {scope === 'region' ? (
                <input className={ADMIN_INPUT_CLASS} value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Region / emirate" />
              ) : null}
              {scope === 'point' ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <input className={ADMIN_INPUT_CLASS} value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Lat" />
                  <input className={ADMIN_INPUT_CLASS} value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Lng" />
                </div>
              ) : null}
              <div className="grid gap-3 md:grid-cols-2">
                <input className={ADMIN_INPUT_CLASS} type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
                <input className={ADMIN_INPUT_CLASS} type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
              </div>
              <input className={ADMIN_INPUT_CLASS} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="Optional link URL" />
              <button type="button" onClick={() => void create()} className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">
                Publish alert
              </button>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-neutral-900">Active and recent</h3>
              <AdminFilterBar
                onClear={() => {
                  setBannerSearch('');
                  setBannerSeverity('');
                  setBannerScope('');
                  setBannerActive('');
                }}
              >
                <label className="text-xs text-neutral-500">
                  Search
                  <input
                    type="search"
                    value={bannerSearch}
                    onChange={(e) => setBannerSearch(e.target.value)}
                    placeholder="Title or body…"
                    className={`${ADMIN_INPUT_CLASS} mt-1 block w-52`}
                  />
                </label>
                <AppSelect
                  value={bannerSeverity}
                  onChange={setBannerSeverity}
                  options={SEVERITY}
                  placeholder="All severities"
                  inputClassName={ADMIN_FILTER_SELECT_CLASS}
                  aria-label="Filter banners by severity"
                />
                <AppSelect
                  value={bannerScope}
                  onChange={setBannerScope}
                  options={SCOPE}
                  placeholder="All scopes"
                  inputClassName={ADMIN_FILTER_SELECT_CLASS}
                  aria-label="Filter banners by scope"
                />
                <AppSelect
                  value={bannerActive}
                  onChange={setBannerActive}
                  options={BANNER_ACTIVE_OPTIONS}
                  placeholder="Active or expired"
                  inputClassName={ADMIN_FILTER_SELECT_CLASS}
                  aria-label="Filter banners by active state"
                />
              </AdminFilterBar>
              <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                {filteredBanners.map((row) => (
                  <li key={row.id} className="flex items-start justify-between gap-3 p-3">
                    <div>
                      <p className="text-sm font-semibold">{row.title}</p>
                      <p className="text-xs text-neutral-500">
                        {row.severity} · {row.scope}
                        {row.active ? '' : ' · expired'}
                      </p>
                      <p className="mt-1 text-sm text-neutral-700">{row.body}</p>
                    </div>
                    {row.active ? (
                      <button
                        type="button"
                        className="shrink-0 text-sm font-semibold text-red-700"
                        onClick={() =>
                          void expireAdminPlatformAlert(row.id)
                            .then(() => refetch())
                            .catch((err) =>
                              setMutationError(err instanceof Error ? err.message : 'Expire failed')
                            )
                        }
                      >
                        Expire
                      </button>
                    ) : null}
                  </li>
                ))}
                {filteredBanners.length === 0 ? (
                  <li className="p-4 text-sm text-neutral-500">
                    {rows.length === 0 ? 'No banners yet.' : 'No banners match these filters.'}
                  </li>
                ) : null}
              </ul>
            </section>
          </div>
        ) : null}

        {tab === 'amenity' ? (
          <div className="space-y-3">
            <AdminFilterBar
              onClear={() => {
                setAmenitySearch('');
                setAmenityStateFilter('');
              }}
            >
              <label className="text-xs text-neutral-500">
                Search
                <input
                  type="search"
                  value={amenitySearch}
                  onChange={(e) => setAmenitySearch(e.target.value)}
                  placeholder="Facility ID or note…"
                  className={`${ADMIN_INPUT_CLASS} mt-1 block w-52`}
                />
              </label>
              <AppSelect
                value={amenityStateFilter}
                onChange={setAmenityStateFilter}
                options={amenityStateOptions}
                placeholder="All amenity states"
                inputClassName={ADMIN_FILTER_SELECT_CLASS}
                aria-label="Filter amenity reports by state"
              />
            </AdminFilterBar>
            <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              {filteredAmenity.map((row) => (
                <li key={row.id} className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-semibold capitalize">{row.amenityState.replace('_', ' ')}</p>
                    <p className="font-mono text-xs text-neutral-500">{row.facilityId}</p>
                    {row.note ? <p className="mt-1 text-sm text-neutral-700">{row.note}</p> : null}
                    {row.photoUrl ? (
                      <a href={row.photoUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-semibold text-emerald-800">
                        View photo
                      </a>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-xl bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white"
                    onClick={() =>
                      void confirmAdminAmenityReport(row.id)
                        .then(() => refetch())
                        .catch((err) =>
                          setMutationError(err instanceof Error ? err.message : 'Confirm failed')
                        )
                    }
                  >
                    Confirm
                  </button>
                </li>
              ))}
              {filteredAmenity.length === 0 ? (
                <li className="p-6 text-center text-sm text-neutral-500">
                  {reports.length === 0 ? 'No pending amenity reports.' : 'No amenity reports match these filters.'}
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}

        {tab === 'verification' ? (
          <div className="space-y-3">
            <AdminFilterBar
              onClear={() => {
                setVerificationSearch('');
                setVerificationStatus('');
              }}
            >
              <label className="text-xs text-neutral-500">
                Search
                <input
                  type="search"
                  value={verificationSearch}
                  onChange={(e) => setVerificationSearch(e.target.value)}
                  placeholder="Organizer or doc type…"
                  className={`${ADMIN_INPUT_CLASS} mt-1 block w-52`}
                />
              </label>
              <AppSelect
                value={verificationStatus}
                onChange={setVerificationStatus}
                options={VERIFICATION_STATUS_OPTIONS}
                placeholder="All statuses"
                inputClassName={ADMIN_FILTER_SELECT_CLASS}
                aria-label="Filter verification by status"
              />
            </AdminFilterBar>
            <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              {filteredVerification.map((row) => (
                <li key={row.id} className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="text-sm font-semibold capitalize">{row.docType.replace('_', ' ')}</p>
                    <p className="font-mono text-xs text-neutral-500">{row.organizerId}</p>
                    <p className="mt-1 text-xs uppercase text-neutral-400">{row.status}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-xl bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white"
                      onClick={() =>
                        void reviewAdminVerificationDocument(row.id, 'accepted')
                          .then(() => refetch())
                          .catch((err) =>
                            setMutationError(err instanceof Error ? err.message : 'Review failed')
                          )
                      }
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="rounded-xl border border-neutral-200 px-3 py-1.5 text-sm font-semibold text-red-700"
                      onClick={() =>
                        void reviewAdminVerificationDocument(row.id, 'rejected')
                          .then(() => refetch())
                          .catch((err) =>
                            setMutationError(err instanceof Error ? err.message : 'Review failed')
                          )
                      }
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
              {filteredVerification.length === 0 ? (
                <li className="p-6 text-center text-sm text-neutral-500">
                  {verification.length === 0 ? 'No pending documents.' : 'No documents match these filters.'}
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};
