import { ShoppingCart } from 'lucide-react';
import { useShopCart } from '../../context/ShopCartContext';

interface ShopCartButtonProps {
  onClick: () => void;
}

export const ShopCartButton = ({ onClick }: ShopCartButtonProps) => {
  const { itemCount } = useShopCart();

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/90 text-emerald-700 ring-1 ring-emerald-200/80 shadow-sm"
      aria-label={`Open cart${itemCount > 0 ? `, ${itemCount} items` : ''}`}
    >
      <ShoppingCart className="w-4 h-4" />
      {itemCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </button>
  );
};
