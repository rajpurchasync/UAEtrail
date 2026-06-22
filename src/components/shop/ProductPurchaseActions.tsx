import { useState } from 'react';
import { ExternalLink, ShoppingCart } from 'lucide-react';
import { ProductDTO } from '@uaetrail/shared-types';
import { useShopCart } from '../../context/ShopCartContext';

type ProductLike = Pick<ProductDTO, 'id' | 'name' | 'priceAed' | 'images' | 'externalUrl'>;

interface ProductPurchaseActionsProps {
  product: ProductLike;
  layout?: 'card' | 'detail';
  onPayNow?: () => void;
}

export const ProductPurchaseActions = ({
  product,
  layout = 'card',
  onPayNow,
}: ProductPurchaseActionsProps) => {
  const { addItem, itemCount } = useShopCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const isExternal = Boolean(product.externalUrl);
  const isDetail = layout === 'detail';

  const handleAddToCart = () => {
    if (isExternal) {
      window.open(product.externalUrl!, '_blank', 'noopener,noreferrer');
      return;
    }
    addItem(product, quantity);
    setJustAdded(true);
  };

  const handleContinue = () => setJustAdded(false);

  const handlePay = () => {
    setJustAdded(false);
    onPayNow?.();
  };

  if (justAdded && !isExternal) {
    return (
      <div className={`space-y-2 ${isDetail ? 'mt-8' : ''}`}>
        <p className={`text-emerald-700 font-medium ${isDetail ? 'text-sm' : 'text-xs text-center'}`}>
          Added to cart{itemCount > 1 ? ` · ${itemCount} items total` : ''}
        </p>
        <div className={`flex gap-2 ${isDetail ? 'flex-col sm:flex-row' : ''}`}>
          <button
            type="button"
            onClick={handleContinue}
            className={`flex-1 font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors ${
              isDetail ? 'px-5 py-3.5 text-sm' : 'py-2.5 text-xs'
            }`}
          >
            Continue shopping
          </button>
          <button
            type="button"
            onClick={handlePay}
            className={`flex-1 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors ${
              isDetail ? 'px-5 py-3.5 text-sm' : 'py-2.5 text-xs'
            }`}
          >
            Pay now
          </button>
        </div>
      </div>
    );
  }

  if (isDetail) {
    return (
      <div className="mt-8 space-y-3">
        <div className="flex items-center gap-3">
          <label htmlFor={`qty-${product.id}`} className="text-sm font-medium text-gray-700 shrink-0">
            Quantity
          </label>
          <div className="inline-flex items-center rounded-xl border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-2 text-gray-600 hover:bg-gray-50"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <input
              id={`qty-${product.id}`}
              type="number"
              min={1}
              max={10}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
              className="w-12 text-center text-sm font-semibold border-x border-gray-200 py-2"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              className="px-3 py-2 text-gray-600 hover:bg-gray-50"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
        >
          {isExternal ? <ExternalLink className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
          {isExternal ? 'Buy on partner site' : 'Add to cart'}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
    >
      {isExternal ? <ExternalLink className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
      {isExternal ? 'Partner site' : 'Add to cart'}
    </button>
  );
};
