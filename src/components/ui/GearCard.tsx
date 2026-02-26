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
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow block cursor-pointer"
    >
      <div className="relative h-48">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        {item.featured && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-400 text-yellow-900">
            Featured
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">
            {item.subcategory}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-emerald-600">
            {formatPrice(item.price)}
          </span>
        </div>
      </div>
    </Link>
  );
};
