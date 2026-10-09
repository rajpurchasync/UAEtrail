import { useCallback, useEffect, useState } from 'react';
import type { AreaDTO } from '@uaetrail/shared-types';
import { api } from '../api/index';

/** Platform admin — curated geographic areas (bounds + slug). */
export const AdminAreas = () => {
  const [areas, setAreas] = useState<AreaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listAdminAreas();
      setAreas(res.data);
    } catch {
      setError('Could not load areas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold text-slate-900">Areas</h1>
      <p className="text-sm text-slate-600">
        Curated map zones (Hatta, Jebel Jais, …). Edit bounds via API until the visual editor ships.
      </p>
      {loading ? <p className="text-slate-500">Loading…</p> : null}
      {error ? <p className="text-red-700">{error}</p> : null}
      <ul className="divide-y rounded-xl border border-slate-200 bg-white">
        {areas.map((area) => (
          <li key={area.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-slate-900">{area.name}</p>
                <p className="text-xs text-slate-500">
                  /area/{area.slug} · {area.region} · {area.status}
                </p>
              </div>
              <span className="text-xs text-slate-400">p{area.priority}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminAreas;
