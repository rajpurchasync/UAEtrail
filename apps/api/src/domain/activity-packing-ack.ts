import {
  formatPackingJoinNote,
  isPackingSignatureValid,
  missingRequiredPackingIds,
  parsePackingList,
} from '@uaetrail/shared-types';
import { ApiError } from '../lib/api-error.js';

export const assertPackingAckForJoin = (input: {
  requirements: string[] | null | undefined;
  packingCheckedIds?: string[] | null;
  packingSignature?: string | null;
}): void => {
  const packing = parsePackingList(input.requirements);
  if (packing.items.length === 0 || packing.mode !== 'strict') return;
  const missing = missingRequiredPackingIds(packing.items, input.packingCheckedIds);
  if (missing.length > 0) {
    throw new ApiError(
      400,
      'packing_items_required',
      'Tick every must-have item before joining this outing.'
    );
  }
  if (!isPackingSignatureValid(input.packingSignature)) {
    throw new ApiError(
      400,
      'packing_signature_required',
      'Type your first and last name to confirm the gear list.'
    );
  }
};

export const composePackingJoinNote = (input: {
  requirements: string[] | null | undefined;
  packingCheckedIds?: string[] | null;
  packingSignature?: string | null;
  note?: string | null;
}): string | undefined => {
  const packing = parsePackingList(input.requirements);
  if (packing.items.length === 0) {
    return input.note?.trim() || undefined;
  }
  const composed = formatPackingJoinNote({
    items: packing.items,
    checkedIds: input.packingCheckedIds ?? [],
    signature: input.packingSignature,
    note: input.note,
  });
  return composed.trim() || undefined;
};
