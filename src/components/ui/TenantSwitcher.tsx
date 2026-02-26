import { useState } from 'react';
import { getActiveTenantId, setActiveTenantId } from '../../api/tenant';

export const TenantSwitcher = ({ onChange }: { onChange: (tenantId: string) => void }) => {
  const [tenantId, setTenantId] = useState(getActiveTenantId());

  const applyTenant = () => {
    setActiveTenantId(tenantId);
    onChange(tenantId);
  };

  return (
    <div className="bg-white rounded-lg border p-3 flex flex-col md:flex-row gap-2 md:items-center">
      <label className="text-sm text-gray-700">Active Tenant ID</label>
      <input
        className="border rounded-md px-3 py-2 text-sm md:w-[320px]"
        value={tenantId}
        onChange={(event) => setTenantId(event.target.value)}
        placeholder="Paste tenant UUID from admin approval response"
      />
      <button onClick={applyTenant} className="px-3 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700">
        Apply Tenant
      </button>
    </div>
  );
};
