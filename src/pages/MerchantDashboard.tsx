import { useEffect, useState } from 'react';
import { api } from '../api/services';
import { MerchantProfileDTO, ProductDTO } from '@uaetrail/shared-types';
import { DashboardLayout } from '../components/layout';

const merchantLinks = [
  { to: '/merchant/dashboard', label: 'Dashboard' },
  { to: '/shop', label: 'Public Shop' }
];

interface MerchantProduct extends ProductDTO {
  createdAt?: string;
}

const emptyProfile = { shopName: '', description: '', logo: '', contactEmail: '', contactPhone: '' };
const emptyProduct = { name: '', description: '', priceAed: 0, discountPercent: 0, packagingInfo: '', category: '', status: 'draft' as 'draft' | 'active', images: [] as string[] };

export const MerchantDashboard = () => {
  const [profile, setProfile] = useState<MerchantProfileDTO | null>(null);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [products, setProducts] = useState<MerchantProduct[]>([]);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'profile' | 'products'>('profile');

  const loadProfile = async () => {
    try {
      const res = await api.getMerchantProfile();
      setProfile(res.data);
      setProfileForm({
        shopName: res.data.shopName,
        description: res.data.description ?? '',
        logo: res.data.logo ?? '',
        contactEmail: res.data.contactEmail ?? '',
        contactPhone: res.data.contactPhone ?? ''
      });
    } catch {
      // profile not created yet
      setProfile(null);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await api.getMerchantProducts();
      setProducts(res.data);
    } catch {
      // not a merchant yet
    }
  };

  useEffect(() => {
    loadProfile();
    loadProducts();
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (profile) {
        await api.updateMerchantProfile(profileForm);
      } else {
        await api.createMerchantProfile({ shopName: profileForm.shopName, description: profileForm.description || undefined, logo: profileForm.logo || undefined, contactEmail: profileForm.contactEmail || undefined, contactPhone: profileForm.contactPhone || undefined });
      }
      await loadProfile();
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
      if (editingProductId) {
        await api.updateMerchantProduct(editingProductId, {
          name: productForm.name,
          description: productForm.description || undefined,
          priceAed: productForm.priceAed,
          discountPercent: productForm.discountPercent || undefined,
          packagingInfo: productForm.packagingInfo || undefined,
          category: productForm.category,
          status: productForm.status
        });
      } else {
        await api.addMerchantProduct({
          name: productForm.name,
          description: productForm.description || undefined,
          priceAed: productForm.priceAed,
          discountPercent: productForm.discountPercent || undefined,
          packagingInfo: productForm.packagingInfo || undefined,
          category: productForm.category,
          status: productForm.status
        });
      }
      setProductForm(emptyProduct);
      setEditingProductId(null);
      setShowProductForm(false);
      await loadProducts();
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
      discountPercent: p.discountPercent ?? 0,
      packagingInfo: p.packagingInfo ?? '',
      category: p.category,
      status: p.status as 'draft' | 'active',
      images: p.images
    });
    setShowProductForm(true);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Deactivate this product?')) return;
    try {
      await api.deleteMerchantProduct(id);
      await loadProducts();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete product');
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { draft: 'bg-gray-100 text-gray-800', active: 'bg-green-100 text-green-800', inactive: 'bg-red-100 text-red-800' };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-800'}`}>{status}</span>;
  };

  return (
    <DashboardLayout title="Merchant Dashboard" links={merchantLinks}>
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button onClick={() => setTab('profile')} className={`pb-2 text-sm font-medium ${tab === 'profile' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-600'}`}>Profile</button>
        <button onClick={() => setTab('products')} className={`pb-2 text-sm font-medium ${tab === 'products' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-gray-600'}`}>Products ({products.length})</button>
      </div>

      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="bg-white border rounded-lg p-6 max-w-lg space-y-4">
          <h3 className="font-semibold text-gray-900">{profile ? 'Edit Profile' : 'Create Merchant Profile'}</h3>
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
            {saving ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
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
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No products yet</td></tr>
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
                        <td className="px-4 py-3">{statusBadge(p.status)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => editProduct(p)} className="px-2 py-1 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs">Edit</button>
                            {p.status !== 'inactive' && (
                              <button onClick={() => deleteProduct(p.id)} className="px-2 py-1 rounded bg-red-100 text-red-800 hover:bg-red-200 text-xs">Deactivate</button>
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
    </DashboardLayout>
  );
};
