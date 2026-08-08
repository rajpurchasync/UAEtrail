import { useEffect, useState } from 'react';
import { ProductDTO } from '@uaetrail/shared-types';
import { api } from '../api/services';
import { DashboardLayout } from '../components/layout';
import { ADMIN_LINKS } from '../constants';

type ShopView = 'all' | 'featured' | 'draft';

interface AdminProduct extends ProductDTO {
  createdAt?: string;
  featured?: boolean;
}

const SHOP_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'apparel', label: 'Apparel' },
  { value: 'camping accessories', label: 'Camping Accessories' },
  { value: 'hiking gears', label: 'Hiking Gears' },
];

export const AdminShop = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ShopView>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<{ product: AdminProduct; newStatus: string } | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminProducts({
        page,
        pageSize: 20,
        status: view === 'draft' ? 'draft' : undefined,
        featured: view === 'featured' ? true : undefined,
        category: categoryFilter || undefined,
      });
      setProducts(res.data ?? []);
      setTotal(res.pagination?.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page, view, categoryFilter]);

  const executeStatusChange = async () => {
    if (!confirmTarget) return;
    try {
      await api.updateAdminProductStatus(confirmTarget.product.id, confirmTarget.newStatus as 'active' | 'inactive');
      setConfirmTarget(null);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product status');
      setConfirmTarget(null);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-600',
      draft: 'bg-yellow-100 text-yellow-800',
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  const formatPrice = (p: AdminProduct) => {
    const base = p.priceAed ?? 0;
    if (p.discountPercent && p.discountPercent > 0) {
      const sale = Math.round(base * (1 - p.discountPercent / 100));
      return (
        <span>
          <span className="text-gray-400 line-through text-xs mr-1">AED {base}</span>
          AED {sale}
        </span>
      );
    }
    return <>AED {base}</>;
  };

  return (
    <DashboardLayout title="Admin Dashboard" links={ADMIN_LINKS}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Shop</h2>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="border rounded px-3 py-1.5 text-sm"
          >
            {SHOP_CATEGORIES.map((c) => (
              <option key={c.value || 'all'} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="border-b flex gap-0">
          {([
            { key: 'all' as const, label: 'All items' },
            { key: 'featured' as const, label: 'Featured (on sale)' },
            { key: 'draft' as const, label: 'Pending review' },
          ]).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { setView(tab.key); setPage(1); }}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                view === tab.key ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="bg-white border rounded-lg overflow-x-auto desktop-scrollbar-x">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-left">Merchant</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Listed</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  <div className="inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />Loading...
                </td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No products found</td></tr>
              ) : products.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt="" className="w-10 h-10 rounded object-cover border" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">No img</div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        {p.description && <p className="text-xs text-gray-500 line-clamp-1 max-w-xs">{p.description}</p>}
                        {p.featured && <span className="text-xs text-amber-700 font-medium">Featured in shop</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.merchantName}</td>
                  <td className="px-4 py-3 capitalize text-xs">{p.category}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatPrice(p)}</td>
                  <td className="px-4 py-3">{statusBadge(p.status)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {p.status !== 'active' && (
                        <button onClick={() => setConfirmTarget({ product: p, newStatus: 'active' })}
                          className="px-2 py-1 rounded bg-green-100 text-green-800 hover:bg-green-200 text-xs">Approve</button>
                      )}
                      {p.status === 'active' && (
                        <button onClick={() => setConfirmTarget({ product: p, newStatus: 'inactive' })}
                          className="px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200 text-xs">Suspend</button>
                      )}
                      {p.status === 'inactive' && (
                        <button onClick={() => setConfirmTarget({ product: p, newStatus: 'active' })}
                          className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-xs">Reopen</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 20 && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Previous</button>
              <button disabled={page * 20 >= total} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {confirmTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConfirmTarget(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmTarget.newStatus === 'active' ? 'Approve / reopen product?' : 'Suspend product?'}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              {confirmTarget.newStatus === 'active'
                ? 'This will make the product visible in the public shop.'
                : 'This will hide the product from the public shop.'}
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">{confirmTarget.product.name} — {confirmTarget.product.merchantName}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmTarget(null)} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={executeStatusChange}
                className={`px-4 py-2 rounded-md text-sm text-white ${confirmTarget.newStatus === 'active' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {confirmTarget.newStatus === 'active' ? 'Confirm' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
