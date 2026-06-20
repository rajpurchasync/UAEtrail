import { Link } from 'react-router-dom';
import { GearItem } from '../../types';
import { formatPrice } from '../../utils';

interface GearCardProps {
  item: GearItem;
}

export const GearCard = ({ item }: GearCardProps) => {
  return (
    <Link
      to={`/shop/${item.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 block cursor-pointer"
    >
      <div className="relative aspect-[4/3] sm:aspect-[4/3] overflow-hidden bg-gray-50">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {item.featured && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-400/90 backdrop-blur-sm text-yellow-900 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            Featured
          </div>
        )}
      </div>

      <div className="p-3.5">
        <div className="mb-1.5">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {item.subcategory}
          </span>
        </div>

        <h3 className="text-sm font-bold text-gray-900 mb-1.5 line-clamp-1">{item.name}</h3>

        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{item.description}</p>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-emerald-600">
            {formatPrice(item.price)}
          </span>
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full group-hover:bg-emerald-100 transition-colors">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
};
