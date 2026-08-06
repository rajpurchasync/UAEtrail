import { Component, Suspense, type ReactNode, useEffect, useRef, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { api } from '../api/services';
import {
  MerchantAnalyticsInterval,
  MerchantAnalyticsSeriesDTO,
  MerchantOrderLineItemDTO,
  MerchantProfileDTO,
  OrderStatus,
  ProductDTO
} from '@uaetrail/shared-types';
import { DashboardLayout } from '../components/layout';
import { ImageUpload } from '../components/ui';

const merchantLinks = [
  { to: '/merchant/dashboard', label: 'Dashboard' },
  { to: '/shop', label: 'Public Shop' }
];

interface MerchantProduct extends ProductDTO {
  createdAt?: string;
}

type AnalyticsFilters = {
  merchantId: string;
  startDate: string;
  endDate: string;
  interval: MerchantAnalyticsInterval;
};

const emptyProfile = { shopName: '', description: '', logo: '', contactEmail: '', contactPhone: '' };
const emptyProduct = {
  name: '',
  description: '',
  priceAed: 0,
  stockQuantity: 0,
  lowStockThreshold: 5,
  discountPercent: 0,
  packagingInfo: '',
  category: '',
  status: 'draft' as 'draft' | 'active',
  images: [] as string[]
};

const analyticsCache = new Map<string, { data?: MerchantAnalyticsSeriesDTO; error?: unknown; promise?: Promise<void> }>();

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);

const buildDefaultDateRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 29);
  return {
    startDate: formatDateInput(startDate),
    endDate: formatDateInput(endDate)
  };
};

const currencyFormatter = new Intl.NumberFormat('en-AE', {
  style: 'currency',
  currency: 'AED',
  maximumFractionDigits: 0
});

const orderStatusOptions: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const readMerchantAnalytics = (filters: AnalyticsFilters) => {
  const key = JSON.stringify(filters);
  let entry = analyticsCache.get(key);

  if (!entry) {
    entry = {};
    entry.promise = api
      .getMerchantAnalytics(filters)
      .then((response) => {
        entry!.data = response.data;
      })
      .catch((error: unknown) => {
        entry!.error = error;
      });
    analyticsCache.set(key, entry);
  }

  if (entry.error) {
    throw entry.error;
  }

  if (!entry.data) {
    throw entry.promise;
  }

  return entry.data;
};

class MerchantAnalyticsErrorBoundary extends Component<
  { children: ReactNode; resetKey: string },
  { errorMessage: string | null }
> {
  state = { errorMessage: null };

  static getDerivedStateFromError(error: unknown) {
    return {
      errorMessage: error instanceof Error ? error.message : 'Failed to load analytics.'
    };
  }

  componentDidUpdate(prevProps: { resetKey: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.errorMessage) {
      this.setState({ errorMessage: null });
    }
  }

  render() {
    if (this.state.errorMessage) {
      return <p className="text-sm text-red-600">{this.state.errorMessage}</p>;
    }

    return this.props.children;
  }
}

const MerchantAnalyticsPanel = ({ filters }: { filters: AnalyticsFilters }) => {
  const analytics = readMerchantAnalytics(filters);
  const totalSales = analytics.points.reduce((sum, point) => sum + point.salesAed, 0);
  const totalClicks = analytics.points.reduce((sum, point) => sum + point.clicks, 0);
  const totalOrders = analytics.points.reduce((sum, point) => sum + point.orderCount, 0);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    const element = chartContainerRef.current;
    if (!element) return;

    const updateReadyState = () => {
      setIsChartReady(element.clientWidth > 0 && element.clientHeight > 0);
    };

    updateReadyState();
    const observer = new ResizeObserver(updateReadyState);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Sales</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{currencyFormatter.format(totalSales)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Clicks</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalClicks.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Orders</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalOrders.toLocaleString()}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Sales vs Clicks</h3>
          <p className="text-sm text-slate-500">Interactive time series for the selected store and date range.</p>
        </div>
        <div ref={chartContainerRef} className="h-80 min-w-0">
          {isChartReady ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.points} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                <XAxis dataKey="bucket" tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis yAxisId="sales" tick={{ fill: '#475569', fontSize: 12 }} tickFormatter={(value) => `AED ${value}`} />
                <YAxis yAxisId="clicks" orientation="right" tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'Sales (AED)') {
                      return [currencyFormatter.format(value), name];
                    }
                    return [value.toLocaleString(), name];
                  }}
                  labelStyle={{ color: '#0f172a' }}
                  contentStyle={{ borderRadius: 16, borderColor: '#cbd5e1' }}
                />
                <Legend />
                <Line yAxisId="sales" type="monotone" dataKey="salesAed" name="Sales (AED)" stroke="#0f766e" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                <Line yAxisId="clicks" type="monotone" dataKey="clicks" name="Clicks" stroke="#f97316" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const MerchantDashboard = () => {
  const [stores, setStores] = useState<MerchantProfileDTO[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [profile, setProfile] = useState<MerchantProfileDTO | null>(null);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [products, setProducts] = useState<MerchantProduct[]>([]);
  const [orders, setOrders] = useState<MerchantOrderLineItemDTO[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [orderStatusDrafts, setOrderStatusDrafts] = useState<Record<string, OrderStatus>>({});
  const [orderTrackingDrafts, setOrderTrackingDrafts] = useState<Record<string, string>>({});
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [tab, setTab] = useState<'profile' | 'products' | 'analytics' | 'orders'>('analytics');
  const [confirmDelete, setConfirmDelete] = useState<MerchantProduct | null>(null);
  const [dateRange, setDateRange] = useState(buildDefaultDateRange);
  const [interval, setInterval] = useState<MerchantAnalyticsInterval>('day');

  const selectedStore = stores.find((store) => store.id === selectedStoreId) ?? null;
  const analyticsKey = `${selectedStoreId ?? 'none'}:${dateRange.startDate}:${dateRange.endDate}:${interval}`;
  const lowStockProducts = products.filter((product) => product.stockQuantity <= product.lowStockThreshold);

  const loadStores = async () => {
    try {
      const res = await api.getMerchantStores();
      setStores(res.data);
      setSelectedStoreId((current) => {
        if (current && res.data.some((store) => store.id === current)) {
          return current;
        }
        return res.data[0]?.id ?? null;
      });
    } catch {
      setStores([]);
      setSelectedStoreId(null);
    }
  };

  const loadProfile = async (merchantId: string) => {
    try {
      const res = await api.getMerchantProfileById(merchantId);
      setProfile(res.data);
      setProfileForm({
        shopName: res.data.shopName,
        description: res.data.description ?? '',
        logo: res.data.logo ?? '',
        contactEmail: res.data.contactEmail ?? '',
        contactPhone: res.data.contactPhone ?? ''
      });
    } catch {
      setProfile(null);
    }
  };

  const loadProducts = async (merchantId: string) => {
    try {
      const res = await api.getMerchantProducts(merchantId);
      setProducts(res.data);
    } catch {
      setProducts([]);
    }
  };

  const loadOrders = async (merchantId: string) => {
    setOrdersLoading(true);
    try {
      const res = await api.getMerchantOrders({ merchantId, page: 1, pageSize: 50 });
      setOrders(res.data);
      setOrderStatusDrafts(
        Object.fromEntries(res.data.map((order) => [order.id, order.status]))
      );
      setOrderTrackingDrafts(
        Object.fromEntries(res.data.map((order) => [order.id, order.fulfillmentTrackingLink ?? '']))
      );
    } catch {
      setOrders([]);
      setOrderStatusDrafts({});
      setOrderTrackingDrafts({});
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    void loadStores();
  }, []);

  useEffect(() => {
    if (!selectedStoreId) {
      setProfile(null);
      setProducts([]);
      setOrders([]);
      return;
    }

    void loadProfile(selectedStoreId);
    void loadProducts(selectedStoreId);
    void loadOrders(selectedStoreId);
  }, [selectedStoreId]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (profile && selectedStoreId) {
        await api.updateMerchantProfile(selectedStoreId, profileForm);
      } else {
        const created = await api.createMerchantProfile({
          shopName: profileForm.shopName,
          description: profileForm.description || undefined,
          logo: profileForm.logo || undefined,
          contactEmail: profileForm.contactEmail || undefined,
          contactPhone: profileForm.contactPhone || undefined
        });
        setSelectedStoreId(created.data.id);
      }
      await loadStores();
      if (selectedStoreId) {
        await loadProfile(selectedStoreId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (!selectedStoreId) {
        throw new Error('Select a store first.');
      }
      if (editingProductId) {
        await api.updateMerchantProduct(editingProductId, {
          name: productForm.name,
          description: productForm.description || undefined,
          images: productForm.images,
          priceAed: productForm.priceAed,
          stockQuantity: productForm.stockQuantity,
          lowStockThreshold: productForm.lowStockThreshold,
          discountPercent: productForm.discountPercent || undefined,
          packagingInfo: productForm.packagingInfo || undefined,
          category: productForm.category,
          status: productForm.status
        });
      } else {
        await api.addMerchantProduct({
          merchantId: selectedStoreId,
          name: productForm.name,
          description: productForm.description || undefined,
          images: productForm.images,
          priceAed: productForm.priceAed,
          stockQuantity: productForm.stockQuantity,
          lowStockThreshold: productForm.lowStockThreshold,
          discountPercent: productForm.discountPercent || undefined,
          packagingInfo: productForm.packagingInfo || undefined,
          category: productForm.category,
          status: productForm.status
        });
      }
      setProductForm(emptyProduct);
      setEditingProductId(null);
      setShowProductForm(false);
      analyticsCache.clear();
      await loadProducts(selectedStoreId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const editProduct = (p: MerchantProduct) => {
    setEditingProductId(p.id);
    setProductForm({
      name: p.name,
      description: p.description ?? '',
      priceAed: p.priceAed,
        stockQuantity: p.stockQuantity,
        lowStockThreshold: p.lowStockThreshold,
      discountPercent: p.discountPercent ?? 0,
      packagingInfo: p.packagingInfo ?? '',
      category: p.category,
      status: p.status as 'draft' | 'active',
      images: p.images
    });
    setShowProductForm(true);
  };

  const deleteProduct = async (id: string) => {
    try {
      await api.deleteMerchantProduct(id);
      setConfirmDelete(null);
      analyticsCache.clear();
      if (selectedStoreId) {
        await loadProducts(selectedStoreId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete product');
      setConfirmDelete(null);
    }
  };

  const updateOrderStatus = async (orderId: string) => {
    setUpdatingOrderId(orderId);
    setError(null);
    try {
      const response = await api.updateMerchantOrderStatus(orderId, {
        status: orderStatusDrafts[orderId] ?? 'pending',
        fulfillmentTrackingLink: orderTrackingDrafts[orderId] || undefined
      });
      const updatedOrder = response.data;
      setOrders((current) => current.map((order) => (order.id === orderId ? updatedOrder : order)));
      setOrderStatusDrafts((current) => ({ ...current, [orderId]: updatedOrder.status }));
      setOrderTrackingDrafts((current) => ({ ...current, [orderId]: updatedOrder.fulfillmentTrackingLink ?? '' }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const downloadAnalyticsReport = async () => {
    if (!selectedStoreId) {
      return;
    }

    setDownloadingReport(true);
    setError(null);
    try {
      const { blob, filename } = await api.downloadMerchantAnalyticsReport({
        merchantId: selectedStoreId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        interval
      });
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to download report');
    } finally {
      setDownloadingReport(false);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { draft: 'bg-gray-100 text-gray-800', active: 'bg-green-100 text-green-800', inactive: 'bg-red-100 text-red-800' };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  const orderStatusBadge = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      pending: 'bg-amber-100 text-amber-800',
      processing: 'bg-sky-100 text-sky-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-rose-100 text-rose-800'
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${colors[status]}`}>{status}</span>;
  };

  return (
    <DashboardLayout title="Merchant Dashboard" links={merchantLinks}>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Store Context</p>
            <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center">
              <select
                value={selectedStoreId ?? ''}
                onChange={(event) => setSelectedStoreId(event.target.value || null)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm md:max-w-sm"
              >
                {stores.length === 0 ? <option value="">Create your first merchant store</option> : null}
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.shopName}
                  </option>
                ))}
              </select>
              <div>
                <p className="text-sm font-medium text-slate-900">{selectedStore?.shopName ?? 'No store selected'}</p>
                <p className="text-sm text-slate-500">{selectedStore?.description ?? 'Choose a managed store to switch dashboard context.'}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm text-slate-600">
              Start Date
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(event) => {
                  analyticsCache.clear();
                  setDateRange((current) => ({ ...current, startDate: event.target.value }));
                }}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm text-slate-600">
              End Date
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(event) => {
                  analyticsCache.clear();
                  setDateRange((current) => ({ ...current, endDate: event.target.value }));
                }}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
            <div className="sm:col-span-2">
              <p className="text-sm text-slate-600">Interval</p>
              <div className="mt-1 flex rounded-xl border border-slate-300 bg-slate-50 p-1">
                {(['day', 'month', 'year'] as MerchantAnalyticsInterval[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      analyticsCache.clear();
                      setInterval(option);
                    }}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize ${interval === option ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b">
        <button onClick={() => setTab('analytics')} className={`pb-2 text-sm font-medium ${tab === 'analytics' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-600'}`}>Analytics</button>
        <button onClick={() => setTab('profile')} className={`pb-2 text-sm font-medium ${tab === 'profile' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-600'}`}>Profile</button>
        <button onClick={() => setTab('products')} className={`pb-2 text-sm font-medium ${tab === 'products' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-600'}`}>Products ({products.length})</button>
        <button onClick={() => setTab('orders')} className={`pb-2 text-sm font-medium ${tab === 'orders' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-600'}`}>Orders ({orders.length})</button>
      </div>

      {tab === 'analytics' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Merchant Analytics</h3>
              <p className="text-sm text-slate-500">Compare order-line revenue and product clicks across the selected time window.</p>
            </div>
            <button
              type="button"
              onClick={() => void downloadAnalyticsReport()}
              disabled={!selectedStoreId || downloadingReport}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {downloadingReport ? 'Preparing report...' : 'Download Excel Report'}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Low Stock Alerts</h3>
                <p className="text-sm text-slate-500">Products at or below their store-defined threshold.</p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">{lowStockProducts.length} alert{lowStockProducts.length === 1 ? '' : 's'}</span>
            </div>
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-slate-500">No low stock alerts for the selected store.</p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{product.name}</p>
                      <p className="text-sm text-slate-500 capitalize">{product.category}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-amber-900">{product.stockQuantity} in stock</p>
                      <p className="text-amber-700">Threshold: {product.lowStockThreshold}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!selectedStoreId ? (
            <p className="text-sm text-slate-500">Create or select a store to view analytics.</p>
          ) : (
            <MerchantAnalyticsErrorBoundary resetKey={analyticsKey}>
              <Suspense fallback={<div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading analytics...</div>}>
                <MerchantAnalyticsPanel
                  filters={{
                    merchantId: selectedStoreId,
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                    interval
                  }}
                />
              </Suspense>
            </MerchantAnalyticsErrorBoundary>
          )}
        </div>
      )}

      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="bg-white border rounded-lg p-6 max-w-lg space-y-4">
          <h3 className="font-semibold text-gray-900">{profile ? 'Edit Store Profile' : 'Create Merchant Store'}</h3>
          <div>
            <label className="text-sm text-gray-700 block mb-1">Shop Name *</label>
            <input type="text" required value={profileForm.shopName} onChange={(e) => setProfileForm({ ...profileForm, shopName: e.target.value })} className="border rounded w-full px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm text-gray-700 block mb-1">Description</label>
            <textarea value={profileForm.description} onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })} className="border rounded w-full px-3 py-2 text-sm" rows={3} />
          </div>
          <div>
            <label className="text-sm text-gray-700 block mb-1">Logo URL</label>
            <input type="url" value={profileForm.logo} onChange={(e) => setProfileForm({ ...profileForm, logo: e.target.value })} className="border rounded w-full px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-700 block mb-1">Contact Email</label>
              <input type="email" value={profileForm.contactEmail} onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })} className="border rounded w-full px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm text-gray-700 block mb-1">Contact Phone</label>
              <input type="text" value={profileForm.contactPhone} onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })} className="border rounded w-full px-3 py-2 text-sm" />
            </div>
          </div>
          <button type="submit" disabled={saving} className="bg-emerald-600 text-white px-4 py-2 rounded text-sm hover:bg-emerald-700 disabled:opacity-50">
            {saving ? 'Saving...' : profile ? 'Update Profile' : 'Create Store'}
          </button>
        </form>
      )}

      {tab === 'products' && (
        <div>
          {!profile ? (
            <p className="text-gray-500 text-sm">Create your merchant profile first to manage products.</p>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Your Products</h3>
                <button onClick={() => { setShowProductForm(true); setEditingProductId(null); setProductForm(emptyProduct); }} className="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm hover:bg-emerald-700">
                  + Add Product
                </button>
              </div>

              {showProductForm && (
                <form onSubmit={saveProduct} className="bg-white border rounded-lg p-6 mb-6 space-y-4 max-w-2xl">
                  <h4 className="font-medium text-sm text-gray-800">{editingProductId ? 'Edit Product' : 'New Product'}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-700 block mb-1">Name *</label>
                      <input type="text" required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="border rounded w-full px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-700 block mb-1">Category *</label>
                      <input type="text" required value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="border rounded w-full px-3 py-2 text-sm" placeholder="e.g. gear, clothing" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-700 block mb-1">Description</label>
                    <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="border rounded w-full px-3 py-2 text-sm" rows={2} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm text-gray-700 block mb-1">Price (AED) *</label>
                      <input type="number" required min={1} value={productForm.priceAed} onChange={(e) => setProductForm({ ...productForm, priceAed: parseInt(e.target.value) || 0 })} className="border rounded w-full px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-700 block mb-1">Stock Quantity *</label>
                      <input type="number" required min={0} value={productForm.stockQuantity} onChange={(e) => setProductForm({ ...productForm, stockQuantity: parseInt(e.target.value) || 0 })} className="border rounded w-full px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-700 block mb-1">Low Stock Threshold *</label>
                      <input type="number" required min={0} value={productForm.lowStockThreshold} onChange={(e) => setProductForm({ ...productForm, lowStockThreshold: parseInt(e.target.value) || 0 })} className="border rounded w-full px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm text-gray-700 block mb-1">Discount %</label>
                      <input type="number" min={0} max={100} value={productForm.discountPercent} onChange={(e) => setProductForm({ ...productForm, discountPercent: parseInt(e.target.value) || 0 })} className="border rounded w-full px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-700 block mb-1">Status</label>
                      <select value={productForm.status} onChange={(e) => setProductForm({ ...productForm, status: e.target.value as 'draft' | 'active' })} className="border rounded w-full px-3 py-2 text-sm">
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-700 block mb-1">Packaging Info</label>
                    <input type="text" value={productForm.packagingInfo} onChange={(e) => setProductForm({ ...productForm, packagingInfo: e.target.value })} className="border rounded w-full px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-700 block mb-2">Product Images</label>
                    <ImageUpload
                      images={productForm.images}
                      onChange={(urls) => setProductForm((prev) => ({ ...prev, images: urls }))}
                      max={6}
                      keyPrefix="products"
                      kind="product-image"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving} className="bg-emerald-600 text-white px-4 py-2 rounded text-sm hover:bg-emerald-700 disabled:opacity-50">
                      {saving ? 'Saving...' : editingProductId ? 'Update' : 'Add Product'}
                    </button>
                    <button type="button" onClick={() => { setShowProductForm(false); setEditingProductId(null); }} className="border px-4 py-2 rounded text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                  </div>
                </form>
              )}

              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Product</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-left">Price</th>
                      <th className="px-4 py-3 text-left">Inventory</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No products yet</td></tr>
                    ) : products.map((p) => (
                      <tr key={p.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{p.name}</p>
                          {p.description && <p className="text-xs text-gray-500 truncate max-w-xs">{p.description}</p>}
                        </td>
                        <td className="px-4 py-3 capitalize">{p.category}</td>
                        <td className="px-4 py-3">
                          <span className="font-medium">AED {p.priceAed}</span>
                          {p.discountPercent ? <span className="text-xs text-emerald-600 ml-1">-{p.discountPercent}%</span> : null}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{p.stockQuantity}</p>
                          <p className="text-xs text-gray-500">Low stock at {p.lowStockThreshold}</p>
                        </td>
                        <td className="px-4 py-3">{statusBadge(p.status)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => editProduct(p)} className="px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs">Edit</button>
                            {p.status !== 'inactive' && (
                              <button onClick={() => setConfirmDelete(p)} className="px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200 text-xs">Deactivate</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
      {tab === 'orders' && (
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="border-b px-4 py-3">
            <h3 className="font-semibold text-gray-900">Order Fulfillment</h3>
            <p className="text-sm text-gray-500">Track status updates for orders belonging to the selected store.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">Ordered</th>
                  <th className="px-4 py-3 text-left">Quantity</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-left">Tracking</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {ordersLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading orders...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No orders found for this store.</td></tr>
                ) : orders.map((order) => (
                  <tr key={order.id} className="border-t align-top hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{order.product.name}</p>
                      <p className="text-xs text-gray-500">Order {order.orderId}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{new Date(order.timestamp).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-900">{order.quantity}</td>
                    <td className="px-4 py-3 text-gray-900">AED {order.totalAed}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <input
                          type="url"
                          value={orderTrackingDrafts[order.id] ?? ''}
                          onChange={(event) => setOrderTrackingDrafts((current) => ({ ...current, [order.id]: event.target.value }))}
                          placeholder="https://tracking.example/order"
                          className="w-full min-w-56 rounded border px-3 py-2 text-sm"
                        />
                        {order.fulfillmentTrackingLink ? <a href={order.fulfillmentTrackingLink} target="_blank" rel="noreferrer" className="text-xs text-emerald-700 underline">Open tracking link</a> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        {orderStatusBadge(order.status)}
                        <div className="flex gap-2">
                          <select
                            value={orderStatusDrafts[order.id] ?? order.status}
                            onChange={(event) => setOrderStatusDrafts((current) => ({ ...current, [order.id]: event.target.value as OrderStatus }))}
                            className="rounded border px-3 py-2 text-sm capitalize"
                          >
                            {orderStatusOptions.map((status) => (
                              <option key={status} value={status} className="capitalize">{status}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => void updateOrderStatus(order.id)}
                            disabled={updatingOrderId === order.id}
                            className="rounded bg-slate-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
                          >
                            {updatingOrderId === order.id ? 'Saving...' : 'Update'}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Deactivate Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Deactivate Product?</h3>
            <p className="text-sm text-gray-600 mb-1">
              This will remove the product from the public shop. You can re-activate it later from your product list.
            </p>
            <p className="text-sm font-medium text-gray-900 mb-4">{confirmDelete.name}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 border rounded-md text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => deleteProduct(confirmDelete.id)} className="px-4 py-2 rounded-md text-sm text-white bg-red-600 hover:bg-red-700">Deactivate</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
