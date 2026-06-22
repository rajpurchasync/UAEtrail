import { SHOP_V1 } from '../config/platform';

export const calcVatAed = (subtotalAed: number, includeVat = true) => {
  if (!includeVat || !SHOP_V1.vatEnabled) return 0;
  return Math.round(subtotalAed * (SHOP_V1.vatPercent / 100));
};

export const calcTotalAed = (subtotalAed: number, includeVat = true) =>
  subtotalAed + calcVatAed(subtotalAed, includeVat);
