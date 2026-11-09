import { useState } from 'react';
import { useSafeAsyncEffect } from '../../hooks/useSafeAsyncEffect';
import { DashboardLayout } from '../../components/layout';
import { ADMIN_LINKS } from '../../constants';
import { ADMIN_INPUT_CLASS, AppSelect } from '../../components/ui/AppSelect';
import type { AdminPlatformAlertDTO, AmenityState } from '@uaetrail/shared-types';
import {
  confirmAdminAmenityReport,
  createAdminPlatformAlert,
  expireAdminPlatformAlert,
  fetchAdminAmenityReports,
  fetchAdminPlatformAlerts,
  fetchAdminVerificationDocuments,
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

export const Alerts = () => {
  const [rows, setRows] = useState<AdminPlatformAlertDTO[]>([]);
  const [reports, setReports] = useState<
    Array<{ id: string; facilityId: string; amenityState: AmenityState; note?: string; createdAt: string }>
  >([]);
  const [verification, setVerification] = useState<
    Array<{ id: string; organizerId: string; docType: string; status: string; createdAt: string }>
  >([]);
  const [error, setError] = useState<string | null>(null);
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

  const reload = async (isActive: () => boolean = () => true) => {
    try {
      const [alerts, amenity, docs] = await Promise.all([
        fetchAdminPlatformAlerts(),
        fetchAdminAmenityReports(),
        fetchAdminVerificationDocuments(),
      ]);
      if (!isActive()) return;
      setRows(alerts);
      setReports(amenity);
      setVerification(docs);
      setError(null);
    } catch (err) {
      if (!isActive()) return;
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    }
  };

  useSafeAsyncEffect((isActive) => reload(isActive), []);

  const create = async () => {
    try {
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
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  };

  return (
    <DashboardLayout title="Alerts" links={ADMIN_LINKS}>
      <div className="space-y-8 p-4">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <section className="space-y-3 rounded-2xl border border-neutral-100 bg-white p-4">
          <h2 className="text-sm font-bold">Create platform alert</h2>
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
          <button type="button" onClick={() => void create()} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">
            Publish alert
          </button>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold">Active and recent</h2>
          <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-100 bg-white">
            {rows.map((row) => (
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
                    onClick={() => void expireAdminPlatformAlert(row.id).then(() => reload())}
                  >
                    Expire
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold">Amenity condition reports</h2>
          <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-100 bg-white">
            {reports.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-3 p-3">
                <div>
                  <p className="text-sm font-semibold">{row.amenityState.replace('_', ' ')}</p>
                  <p className="text-xs text-neutral-500">{row.facilityId}</p>
                  {row.note ? <p className="mt-1 text-sm text-neutral-700">{row.note}</p> : null}
                </div>
                <button
                  type="button"
                  className="shrink-0 text-sm font-semibold text-emerald-800"
                  onClick={() => void confirmAdminAmenityReport(row.id).then(() => reload())}
                >
                  Confirm
                </button>
              </li>
            ))}
            {reports.length === 0 ? <li className="p-3 text-sm text-neutral-500">No pending reports.</li> : null}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold">Host verification</h2>
          <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-100 bg-white">
            {verification.map((row) => (
              <li key={row.id} className="flex items-start justify-between gap-3 p-3">
                <div>
                  <p className="text-sm font-semibold">{row.docType.replace('_', ' ')}</p>
                  <p className="text-xs text-neutral-500">{row.organizerId}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="text-sm font-semibold text-emerald-800"
                    onClick={() =>
                      void reviewAdminVerificationDocument(row.id, 'accepted').then(() => reload())
                    }
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="text-sm font-semibold text-red-700"
                    onClick={() =>
                      void reviewAdminVerificationDocument(row.id, 'rejected').then(() => reload())
                    }
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
            {verification.length === 0 ? (
              <li className="p-3 text-sm text-neutral-500">No pending documents.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </DashboardLayout>
  );
};
