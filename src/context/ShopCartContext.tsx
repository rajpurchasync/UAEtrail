import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ProductDTO } from '@uaetrail/shared-types';
import { calcTotalAed, calcVatAed } from '../utils/shopPricing';

const STORAGE_KEY = 'uaetrail_shop_cart_v1';
const VAT_STORAGE_KEY = 'uaetrail_shop_vat_included';

export interface CartLine {
  productId: string;
  quantity: number;
  name: string;
  priceAed: number;
  image?: string;
  externalUrl?: string | null;
}

interface ShopCartContextValue {
  items: CartLine[];
  itemCount: number;
  subtotalAed: number;
  vatAed: number;
  totalAed: number;
  includeVat: boolean;
  setIncludeVat: (value: boolean) => void;
  addItem: (product: Pick<ProductDTO, 'id' | 'name' | 'priceAed' | 'images' | 'externalUrl'>, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
}

const ShopCartContext = createContext<ShopCartContextValue | null>(null);

const readStoredCart = (): CartLine[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    return Array.isArray(parsed) ? parsed.filter((line) => line.productId && line.quantity > 0) : [];
  } catch {
    return [];
  }
};

const readVatPreference = (): boolean => {
  try {
    const raw = localStorage.getItem(VAT_STORAGE_KEY);
    if (raw === 'false') return false;
    return true;
  } catch {
    return true;
  }
};

export const ShopCartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartLine[]>(() => readStoredCart());
  const [includeVat, setIncludeVatState] = useState(readVatPreference);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(VAT_STORAGE_KEY, String(includeVat));
  }, [includeVat]);

  const setIncludeVat = useCallback((value: boolean) => setIncludeVatState(value), []);

  const addItem = useCallback(
    (product: Pick<ProductDTO, 'id' | 'name' | 'priceAed' | 'images' | 'externalUrl'>, quantity = 1) => {
      const qty = Math.min(10, Math.max(1, quantity));
      setItems((prev) => {
        const existing = prev.find((line) => line.productId === product.id);
        if (existing) {
          return prev.map((line) =>
            line.productId === product.id
              ? { ...line, quantity: Math.min(10, line.quantity + qty) }
              : line
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            quantity: qty,
            name: product.name,
            priceAed: product.priceAed,
            image: product.images?.[0],
            externalUrl: product.externalUrl,
          },
        ];
      });
    },
    []
  );

  const setQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((line) => line.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((line) =>
        line.productId === productId ? { ...line, quantity: Math.min(10, quantity) } : line
      )
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((line) => line.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const isInCart = useCallback((productId: string) => items.some((line) => line.productId === productId), [items]);

  const itemCount = useMemo(() => items.reduce((sum, line) => sum + line.quantity, 0), [items]);
  const subtotalAed = useMemo(
    () => items.reduce((sum, line) => sum + line.priceAed * line.quantity, 0),
    [items]
  );
  const vatAed = useMemo(() => calcVatAed(subtotalAed, includeVat), [subtotalAed, includeVat]);
  const totalAed = useMemo(() => calcTotalAed(subtotalAed, includeVat), [subtotalAed, includeVat]);

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotalAed,
      vatAed,
      totalAed,
      includeVat,
      setIncludeVat,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      isInCart,
    }),
    [items, itemCount, subtotalAed, vatAed, totalAed, includeVat, setIncludeVat, addItem, setQuantity, removeItem, clearCart, isInCart]
  );

  return <ShopCartContext.Provider value={value}>{children}</ShopCartContext.Provider>;
};

export const useShopCart = (): ShopCartContextValue => {
  const ctx = useContext(ShopCartContext);
  if (!ctx) throw new Error('useShopCart must be used within ShopCartProvider');
  return ctx;
};
