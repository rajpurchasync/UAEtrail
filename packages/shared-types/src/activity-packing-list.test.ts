import { describe, expect, it } from 'vitest';
import { hasJoinInstructions } from './join-instructions.js';
import {
  encodePackingListRequirements,
  formatPackingJoinNote,
  isPackingSignatureValid,
  missingRequiredPackingIds,
  parsePackingList,
  defaultHikingPackingItems,
  movePackingItemInGroup,
  withHikingKitExtras,
  placePackingItem,
} from './activity-packing-list.js';

describe('activity packing list', () => {
  it('round-trips default hiking items and strict mode', () => {
    const items = defaultHikingPackingItems();
    const encoded = encodePackingListRequirements('strict', items);
    expect(encoded[0]).toBe('Packing ack: strict');
    expect(parsePackingList(encoded)).toEqual({ mode: 'strict', items });
  });

  it('requires every must-have id and a two-word signature', () => {
    const items = defaultHikingPackingItems();
    expect(missingRequiredPackingIds(items, ['shoes', 'hat'])).toContain('bag');
    expect(missingRequiredPackingIds(items, items.filter((row) => row.required).map((row) => row.id))).toEqual(
      []
    );
    expect(isPackingSignatureValid('Jane')).toBe(false);
    expect(isPackingSignatureValid('Jane Doe')).toBe(true);
  });

  it('counts a packing list as join instructions for publish', () => {
    expect(hasJoinInstructions(encodePackingListRequirements('lenient', defaultHikingPackingItems()))).toBe(
      true
    );
  });

  it('reorders within must-have without mixing nice-to-have', () => {
    const items = defaultHikingPackingItems();
    const mustIds = items.filter((item) => item.required).map((item) => item.id);
    const moved = movePackingItemInGroup(items, mustIds[0], mustIds.length - 1);
    expect(moved.filter((item) => item.required).map((item) => item.id)).toEqual([
      ...mustIds.slice(1),
      mustIds[0],
    ]);
    expect(moved.filter((item) => !item.required).map((item) => item.id)).toEqual(
      items.filter((item) => !item.required).map((item) => item.id)
    );
  });

  it('appends new kit extras without restoring removed defaults', () => {
    const items = defaultHikingPackingItems().filter((item) => item.id !== 'jacket');
    const next = withHikingKitExtras(items.filter((item) => item.id !== 'headlamp'));
    expect(next.some((item) => item.id === 'jacket')).toBe(false);
    expect(next.some((item) => item.id === 'headlamp')).toBe(true);
    expect(next.some((item) => item.id === 'snacks')).toBe(true);
  });

  it('moves an item from must-have into nice-to-have', () => {
    const items = defaultHikingPackingItems();
    const placed = placePackingItem(items, 'shoes', false, 0);
    expect(placed.find((item) => item.id === 'shoes')?.required).toBe(false);
    expect(placed.filter((item) => !item.required).map((item) => item.id)[0]).toBe('shoes');
  });

  it('formats a host-visible join note', () => {
    const items = defaultHikingPackingItems().slice(0, 2);
    expect(
      formatPackingJoinNote({
        items,
        checkedIds: ['shoes'],
        signature: 'Jane Doe',
        note: 'See you at 7.',
      })
    ).toContain('🥾 Hiking Shoes');
  });
});
