import { useEffect, useState } from 'react';
import { getActiveTenantId, setActiveTenantId } from '../../api/tenant';
import { api, TenantMembershipView } from '../../api/services';

export const TenantSwitcher = ({ onChange }: { onChange: (tenantId: string) => void }) => {
  const [tenants, setTenants] = useState<TenantMembershipView[]>([]);
  const [selected, setSelected] = useState(getActiveTenantId());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMyTenants()
      .then((res) => {
        const list = res.data ?? [];
        setTenants(list);
        // Auto-select first tenant if none is active
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
      <div className="bg-white rounded-lg border p-3">
        <p className="text-sm text-gray-500">Loading organizations...</p>
      </div>
    );
  }

  if (tenants.length === 0) {
    // Fallback: manual UUID input for edge cases
    return (
      <div className="bg-white rounded-lg border p-3 flex flex-col md:flex-row gap-2 md:items-center">
        <label className="text-sm text-gray-700">Organization</label>
        <input
          className="border rounded-md px-3 py-2 text-sm md:w-[320px]"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          placeholder="Enter tenant ID"
        />
        <button onClick={() => handleChange(selected)} className="px-3 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700">
          Apply
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-3 flex flex-col md:flex-row gap-2 md:items-center">
      <label className="text-sm font-medium text-gray-700">Organization</label>
      <select
        value={selected}
        onChange={(e) => handleChange(e.target.value)}
        className="border rounded-md px-3 py-2 text-sm md:w-[320px] bg-white"
      >
        <option value="">Select organization...</option>
        {tenants.map((t) => (
          <option key={t.tenantId} value={t.tenantId}>
            {t.tenantName} ({t.tenantType === 'company' ? 'Company' : 'Guide'}) — {t.membershipRole.replace('tenant_', '')}
          </option>
        ))}
      </select>
      {selected && (
        <span className="text-xs text-emerald-600 font-medium">Active</span>
      )}
    </div>
  );
};
