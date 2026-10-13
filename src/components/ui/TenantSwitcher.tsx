import { useEffect, useState } from 'react';
import { getActiveTenantId, setActiveTenantId } from '../../api/tenant';
import type { TenantMembershipView } from '../../api/types';
import { fetchMyTenantMemberships } from '../../hooks/tenantMembershipApi';
import { AppSelect } from './AppSelect';

export const TenantSwitcher = ({ onChange }: { onChange: (tenantId: string) => void }) => {
  const [tenants, setTenants] = useState<TenantMembershipView[]>([]);
  const [selected, setSelected] = useState(getActiveTenantId());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyTenantMemberships()
      .then((list) => {
        setTenants(list);
        if (!selected && list.length === 1) {
          const firstId = list[0].tenantId;
          setSelected(firstId);
          setActiveTenantId(firstId);
          onChange(firstId);
        }
      })
      .catch(() => { /* fallback to manual input */ })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (tenantId: string) => {
    setSelected(tenantId);
    setActiveTenantId(tenantId);
    onChange(tenantId);
  };

  if (loading) {
    return (
      <div className="w-full rounded-2xl border border-emerald-100/80 bg-white/90 px-3.5 py-3 shadow-sm">
        <p className="text-sm text-neutral-600">Loading host profiles…</p>
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-amber-200/80 bg-amber-50/60 px-3.5 py-3 space-y-2.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-amber-800">Host profile ID</label>
        <input
          className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm bg-white"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          placeholder="Enter tenant ID"
        />
        <button
          type="button"
          onClick={() => handleChange(selected)}
          className="w-full sm:w-auto px-3 py-2 bg-neutral-900 text-white text-sm rounded-xl hover:bg-neutral-700"
        >
          Apply
        </button>
      </div>
    );
  }

  const activeTenant = tenants.find((tenant) => tenant.tenantId === selected);
  const tenantOptions = tenants.map((tenant) => ({
    value: tenant.tenantId,
    label: `${tenant.tenantName} (${tenant.tenantType === 'company' ? 'Company' : 'Guide'}) · ${tenant.membershipRole.replace('tenant_', '')}`,
  }));

  return (
    <div className="w-full rounded-2xl border border-emerald-100/80 bg-white/95 px-3.5 py-3 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Host profile</label>
        {activeTenant && <span className="text-[11px] font-semibold text-emerald-700">Active</span>}
      </div>

      <AppSelect
        value={selected}
        onChange={handleChange}
        options={tenantOptions}
        placeholder="Select host profile…"
        inputClassName="w-full rounded-xl border border-emerald-100 bg-white px-3 py-2.5 text-sm text-neutral-900"
        aria-label="Host profile"
      />

      {activeTenant && (
        <p className="text-xs text-neutral-600 truncate">
          Managing as <span className="font-semibold text-neutral-800">{activeTenant.tenantName}</span>
        </p>
      )}
    </div>
  );
};
