import { useState, useMemo } from 'react';
import { gearItems } from '../data';
import { GearCard } from '../components/ui/GearCard';
import { ActivityType } from '../types';
import { HIKING_SUBCATEGORIES, CAMPING_SUBCATEGORIES } from '../constants';

export const Shop = () => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | ActivityType>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');

  const availableSubcategories = useMemo(() => {
    if (categoryFilter === 'hiking') return HIKING_SUBCATEGORIES;
    if (categoryFilter === 'camping') return CAMPING_SUBCATEGORIES;
    return [...HIKING_SUBCATEGORIES, ...CAMPING_SUBCATEGORIES];
  }, [categoryFilter]);

  const filteredGear = useMemo(() => {
    return gearItems.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }
      if (subcategoryFilter !== 'all' && item.subcategory !== subcategoryFilter) {
        return false;
      }
      return true;
    });
  }, [categoryFilter, subcategoryFilter]);

  const featuredGear = gearItems.filter((g) => g.featured).slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="relative h-48 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1600)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 via-emerald-800/70 to-teal-900/80" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="text-white max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Hiking & Camping Gear</h1>
            <p className="text-lg md:text-xl mb-6">
              Essential equipment for your outdoor adventures
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredGear.map((item) => (
              <GearCard key={item.id} item={item} />
            ))}
          </div>
        </section>

        <div className="bg-emerald-600 text-white rounded-lg p-6 mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Premium Members Get 15% Off</h3>
              <p>Upgrade to premium membership and save on all gear purchases</p>
            </div>
            <a
              href="/membership"
              className="bg-white text-emerald-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Learn More
            </a>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <aside className="md:w-64">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-20">
              <h3 className="font-semibold text-gray-900 mb-4">Category</h3>
              <div className="space-y-2 mb-6">
                <button
                  onClick={() => {
                    setCategoryFilter('all');
                    setSubcategoryFilter('all');
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    categoryFilter === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Gear
                </button>
                <button
                  onClick={() => {
                    setCategoryFilter('hiking');
                    setSubcategoryFilter('all');
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    categoryFilter === 'hiking'
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Hiking
                </button>
                <button
                  onClick={() => {
                    setCategoryFilter('camping');
                    setSubcategoryFilter('all');
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    categoryFilter === 'camping'
                      ? 'bg-amber-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Camping
                </button>
              </div>

              <h3 className="font-semibold text-gray-900 mb-4">Subcategory</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSubcategoryFilter('all')}
                  className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    subcategoryFilter === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All
                </button>
                {availableSubcategories.map((subcat) => (
                  <button
                    key={subcat}
                    onClick={() => setSubcategoryFilter(subcat)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      subcategoryFilter === subcat
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {subcat}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-4 text-sm text-gray-600">
              {filteredGear.length} products found
            </div>

            {filteredGear.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No products found in this category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGear.map((item) => (
                  <GearCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
