import { useEffect, useState } from 'react';
import { LocationDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { getActiveTenantId } from '../api/tenant';
import { OrganizerShell } from '../components/organizer/OrganizerShell';
import { TenantSwitcher, SubmitLocationForm, ShareButton } from '../components/ui';
import { locationSharePath } from '../utils/share';

const statusLabel = (status: LocationDTO['status']) => {
  if (status === 'draft') return 'Pending review';
  if (status === 'active') return 'Approved';
  return 'Inactive';
};

export const OrganizerLocations = () => {
  const [tenantId, setTenantId] = useState(getActiveTenantId());
  const [submitted, setSubmitted] = useState<LocationDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSubmitted = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await api.getOrganizerSubmittedLocations(tenantId);
      setSubmitted(res.data);
    } catch {
      setSubmitted([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSubmitted();
  }, [tenantId]);

  return (
    <OrganizerShell title="Venues">
      <div className="space-y-6 max-w-2xl">
        <TenantSwitcher onChange={setTenantId} />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Submit a venue</h2>
          <p className="text-sm text-gray-600 mt-1">
            Add a trail, camp, or spot to the catalog. This is separate from scheduling an activity — once a venue is
            approved, you can pick it when you create an activity under Activities.
          </p>
        </div>

        {tenantId ? (
          <div className="bg-white border rounded-xl p-6">
            <SubmitLocationForm
              tenantId={tenantId}
              onSubmitted={() => void loadSubmitted()}
            />
          </div>
        ) : (
          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-4 py-3">Select your organization above.</p>
        )}

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Your submissions</h3>
          {loading && <p className="text-sm text-gray-400">Loading…</p>}
          {!loading && submitted.length === 0 && (
            <p className="text-sm text-gray-500">No locations submitted yet.</p>
          )}
          <div className="space-y-2">
            {submitted.map((loc) => (
              <div key={loc.id} className="bg-white border rounded-lg p-4 flex justify-between items-center gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {loc.images?.[0] ? (
                    <img src={loc.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{loc.name}</p>
                    <p className="text-xs text-gray-500">
                      {loc.region} · {loc.activityType}
                      {loc.countryCode ? ` · ${loc.countryCode}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {loc.status === 'active' && (
                    <ShareButton
                      title={loc.name}
                      text={`${loc.region} · ${loc.activityType} on UAE Trails`}
                      path={locationSharePath(loc.activityType, loc.id)}
                      iconOnly
                      light
                    />
                  )}
                  <span
                  className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                    loc.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : loc.status === 'draft'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {statusLabel(loc.status)}
                </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </OrganizerShell>
  );
};
