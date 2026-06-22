import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/services';
import { useAuth } from '../context/AuthContext';
import type { CartLine } from '../context/ShopCartContext';

export const useShopCheckout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getCheckoutConfig().then((res) => setStripeEnabled(res.data.stripeEnabled)).catch(() => setStripeEnabled(false));
  }, []);

  const checkoutItems = useCallback(
    async (items: Array<{ productId: string; quantity: number }>, returnPath?: string, includeVat = true) => {
      if (items.length === 0) {
        setError('Your cart is empty.');
        return false;
      }
      if (!user) {
        navigate('/signin', { state: { from: returnPath ?? location.pathname } });
        return false;
      }
      setCheckingOut(true);
      setError(null);
      try {
        const res = await api.createCheckoutSession({ items, includeVat });
        if (res.data.url) {
          window.location.href = res.data.url;
          return true;
        }
        setError('Checkout could not be started. Please try again.');
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Checkout failed');
        return false;
      } finally {
        setCheckingOut(false);
      }
    },
    [user, navigate, location.pathname]
  );

  const checkoutProduct = useCallback(
    (productId: string, quantity = 1, returnPath?: string, includeVat = true) =>
      checkoutItems([{ productId, quantity }], returnPath, includeVat),
    [checkoutItems]
  );

  const checkoutCart = useCallback(
    (cartItems: CartLine[], returnPath?: string, includeVat = true) => {
      const nativeItems = cartItems.filter((line) => !line.externalUrl);
      if (nativeItems.length === 0) {
        setError('Cart only contains partner products — use their buy links.');
        return Promise.resolve(false);
      }
      return checkoutItems(
        nativeItems.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        returnPath,
        includeVat
      );
    },
    [checkoutItems]
  );

  return {
    stripeEnabled,
    checkingOut,
    error,
    setError,
    checkoutProduct,
    checkoutCart,
    checkoutItems,
  };
};
