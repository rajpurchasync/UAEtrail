import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { SHOP_V1 } from '../../config/platform';
import { useShopCart } from '../../context/ShopCartContext';
import { useShopCheckout } from '../../hooks/useShopCheckout';

interface ShopCartSheetProps {
  open: boolean;
  onClose: () => void;
}

export const ShopCartSheet = ({ open, onClose }: ShopCartSheetProps) => {
  const { items, itemCount, subtotalAed, vatAed, totalAed, includeVat, setIncludeVat, setQuantity, removeItem } =
    useShopCart();
  const { stripeEnabled, checkingOut, error, checkoutCart } = useShopCheckout();
  const [localMsg, setLocalMsg] = useState<string | null>(null);

  if (!open) return null;

  const hasExternalOnly = items.length > 0 && items.every((line) => line.externalUrl);
  const nativeCount = items.filter((line) => !line.externalUrl).length;

  const handlePay = async () => {
    setLocalMsg(null);
    const ok = await checkoutCart(items, '/shop', includeVat);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end md:justify-center md:items-center md:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close cart"
        onClick={onClose}
      />
      <div className="relative w-full md:max-w-lg bg-white rounded-t-[20px] md:rounded-2xl shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-0.5 -ml-1 pl-1 pr-2 py-1 text-emerald-600 font-medium text-sm"
            aria-label="Back to shop"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex-1 text-center -ml-12 pointer-events-none">
            <h2 className="text-lg font-bold text-gray-900">Your cart</h2>
            <p className="text-xs text-gray-500">{itemCount} item{itemCount === 1 ? '' : 's'}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-10">
              <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Your cart is empty</p>
              <Link
                to="/shop"
                onClick={onClose}
                className="inline-block mt-3 text-sm font-semibold text-emerald-700"
              >
                Browse shop
              </Link>
            </div>
          ) : (
            items.map((line) => (
              <div key={line.productId} className="flex gap-3 p-3 rounded-xl border border-gray-100">
                <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {line.image ? (
                    <img src={line.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${line.productId}`}
                    onClick={onClose}
                    className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-emerald-700"
                  >
                    {line.name}
                  </Link>
                  <p className="text-sm font-bold text-emerald-700 mt-1">AED {line.priceAed}</p>
                  {line.externalUrl ? (
                    <a
                      href={line.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-amber-700 font-medium mt-1 inline-block"
                    >
                      Buy on partner site →
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, line.quantity - 1)}
                        className="p-1 rounded-lg border border-gray-200"
                        aria-label="Decrease"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, line.quantity + 1)}
                        className="p-1 rounded-lg border border-gray-200"
                        aria-label="Increase"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(line.productId)}
                        className="ml-auto p-1 text-red-500 hover:bg-red-50 rounded-lg"
                        aria-label="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-4 pb-nav-safe space-y-3">
            {SHOP_V1.vatEnabled && (
              <label className="flex items-center justify-between gap-3 text-sm cursor-pointer">
                <span className="text-gray-700">Include VAT ({SHOP_V1.vatPercent}%)</span>
                <input
                  type="checkbox"
                  checked={includeVat}
                  onChange={(e) => setIncludeVat(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
              </label>
            )}

            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-900">AED {subtotalAed.toLocaleString()}</span>
              </div>
              {includeVat && vatAed > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">VAT ({SHOP_V1.vatPercent}%)</span>
                  <span className="font-medium text-gray-900">AED {vatAed.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900">AED {totalAed.toLocaleString()}</span>
              </div>
            </div>

            {hasExternalOnly && (
              <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
                Partner items must be purchased on their site. Remove them to checkout other products here.
              </p>
            )}
            {!stripeEnabled && nativeCount > 0 && (
              <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
                Online payment is not live yet — your cart is saved on this device.
              </p>
            )}
            {(error || localMsg) && <p className="text-xs text-red-600">{error ?? localMsg}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Continue shopping
              </button>
              <button
                type="button"
                onClick={() => void handlePay()}
                disabled={checkingOut || hasExternalOnly || nativeCount === 0 || !stripeEnabled}
                className="flex-1 py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition-colors"
              >
                {checkingOut ? 'Processing…' : 'Pay now'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
