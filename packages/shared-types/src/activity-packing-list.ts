export type PackingAckMode = 'strict' | 'lenient';

export type PackingItem = {
  id: string;
  label: string;
  emoji: string;
  required: boolean;
};

export const PACKING_ACK_PREFIX = 'Packing ack: ';
export const PACKING_ITEM_PREFIX = 'Packing item: ';

export const DEFAULT_HIKING_PACKING_ITEMS: PackingItem[] = [
  { id: 'shoes', label: 'Hiking Shoes', emoji: '🥾', required: true },
  { id: 'poles', label: 'Trekking poles', emoji: '🎿', required: false },
  { id: 'bag', label: 'Hiking bag', emoji: '🎒', required: true },
  { id: 'hat', label: 'Hat', emoji: '🧢', required: true },
  { id: 'sunscreen', label: 'Sunscreen', emoji: '🧴', required: true },
  { id: 'sunglasses', label: 'Sunglasses', emoji: '🕶️', required: false },
  { id: 'gloves', label: 'Gloves', emoji: '🧤', required: false },
  { id: 'jacket', label: 'Jacket', emoji: '🧥', required: false },
  { id: 'headlamp', label: 'Headlamp', emoji: '🔦', required: true },
  { id: 'towel', label: 'Towel', emoji: '🧺', required: false },
  { id: 'snacks', label: 'Energy snacks', emoji: '🍫', required: false },
  { id: 'electrolytes', label: 'Electrolytes', emoji: '🧂', required: true },
];

export const defaultHikingPackingItems = (): PackingItem[] =>
  DEFAULT_HIKING_PACKING_ITEMS.map((item) => ({ ...item }));

const HIKING_KIT_EXTRA_IDS = new Set(['headlamp', 'towel', 'snacks', 'electrolytes']);

/** Append newly added default kit rows without restoring items the host already removed. */
export const withHikingKitExtras = (items: PackingItem[]): PackingItem[] => {
  const have = new Set(items.map((item) => item.id));
  const extras = DEFAULT_HIKING_PACKING_ITEMS.filter(
    (item) => HIKING_KIT_EXTRA_IDS.has(item.id) && !have.has(item.id)
  ).map((item) => ({ ...item }));
  return extras.length ? [...items, ...extras] : items;
};

export const packingItemDisplay = (item: Pick<PackingItem, 'emoji' | 'label'>): string =>
  `${item.emoji} ${item.label}`.trim();

const sanitizePart = (value: string): string => value.replace(/\|/g, '/').trim().slice(0, 80);

export const encodePackingListRequirements = (
  mode: PackingAckMode,
  items: PackingItem[]
): string[] => {
  const cleaned = items
    .map((item) => ({
      ...item,
      id: sanitizePart(item.id) || `item-${items.indexOf(item)}`,
      label: sanitizePart(item.label),
      emoji: sanitizePart(item.emoji).slice(0, 8) || '•',
    }))
    .filter((item) => item.label.length > 0);
  if (cleaned.length === 0) return [];
  return [
    `${PACKING_ACK_PREFIX}${mode}`,
    ...cleaned.map(
      (item) =>
        `${PACKING_ITEM_PREFIX}${item.required ? 'must' : 'nice'}|${item.id}|${item.emoji}|${item.label}`
    ),
  ];
};

export const parsePackingAckMode = (requirements: string[] | null | undefined): PackingAckMode => {
  const line = (requirements ?? []).find((item) => item.trim().startsWith(PACKING_ACK_PREFIX));
  const value = line?.slice(PACKING_ACK_PREFIX.length).trim().toLowerCase();
  return value === 'strict' ? 'strict' : 'lenient';
};

export const parsePackingListItems = (requirements: string[] | null | undefined): PackingItem[] =>
  (requirements ?? [])
    .map((raw) => raw.trim())
    .filter((line) => line.startsWith(PACKING_ITEM_PREFIX))
    .map((line) => {
      const payload = line.slice(PACKING_ITEM_PREFIX.length);
      const [kind, id, emoji, ...labelParts] = payload.split('|');
      const label = labelParts.join('|').trim();
      if (!id?.trim() || !label) return null;
      return {
        id: id.trim(),
        emoji: (emoji || '•').trim(),
        label,
        required: kind === 'must',
      } satisfies PackingItem;
    })
    .filter((item): item is PackingItem => Boolean(item));

export const parsePackingList = (
  requirements: string[] | null | undefined
): { mode: PackingAckMode; items: PackingItem[] } => ({
  mode: parsePackingAckMode(requirements),
  items: parsePackingListItems(requirements),
});

export const hasPackingList = (requirements: string[] | null | undefined): boolean =>
  parsePackingListItems(requirements).length > 0;

export const requiredPackingItems = (items: PackingItem[]): PackingItem[] =>
  items.filter((item) => item.required);

export const optionalPackingItems = (items: PackingItem[]): PackingItem[] =>
  items.filter((item) => !item.required);

/** Place an item into must-have or nice-to-have at `toIndex` (0 = first). Result is must-haves, then nice-to-haves. */
export const placePackingItem = (
  items: PackingItem[],
  id: string,
  required: boolean,
  toIndex: number
): PackingItem[] => {
  const current = items.find((item) => item.id === id);
  if (!current) return items;
  const without = items.filter((item) => item.id !== id);
  const must = without.filter((item) => item.required);
  const nice = without.filter((item) => !item.required);
  const target = required ? [...must] : [...nice];
  const other = required ? nice : must;
  const clamped = Math.max(0, Math.min(target.length, toIndex));
  target.splice(clamped, 0, { ...current, required });
  return required ? [...target, ...other] : [...other, ...target];
};

/** Reorder within must-have or nice-to-have. */
export const movePackingItemInGroup = (
  items: PackingItem[],
  id: string,
  toIndex: number
): PackingItem[] => {
  const current = items.find((item) => item.id === id);
  if (!current) return items;
  return placePackingItem(items, id, current.required, toIndex);
};

export const missingRequiredPackingIds = (
  items: PackingItem[],
  checkedIds: string[] | null | undefined
): string[] => {
  const checked = new Set((checkedIds ?? []).map((id) => id.trim()).filter(Boolean));
  return requiredPackingItems(items)
    .map((item) => item.id)
    .filter((id) => !checked.has(id));
};

const FULL_NAME = /^\s*\S+(?:\s+\S+)+\s*$/;

export const isPackingSignatureValid = (value: string | null | undefined): boolean => {
  const trimmed = value?.trim() ?? '';
  return trimmed.length >= 3 && trimmed.length <= 80 && FULL_NAME.test(trimmed);
};

export const formatPackingJoinNote = (input: {
  items: PackingItem[];
  checkedIds: string[];
  signature?: string | null;
  note?: string | null;
}): string => {
  const checked = new Set(input.checkedIds);
  const brought = input.items
    .filter((item) => checked.has(item.id))
    .map((item) => packingItemDisplay(item));
  const parts: string[] = [];
  if (brought.length) parts.push(`Bringing: ${brought.join(', ')}`);
  const signed = input.signature?.trim();
  if (signed) parts.push(`Signed: ${signed}`);
  const extra = input.note?.trim();
  if (extra) parts.push(extra);
  return parts.join('\n').slice(0, 1000);
};

export const isPackingRequirementLine = (line: string): boolean => {
  const trimmed = line.trim();
  return trimmed.startsWith(PACKING_ACK_PREFIX) || trimmed.startsWith(PACKING_ITEM_PREFIX);
};
