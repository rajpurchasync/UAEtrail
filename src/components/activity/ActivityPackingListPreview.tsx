import type { PackingItem } from '@uaetrail/shared-types';
import {
  optionalPackingItems,
  parsePackingList,
  requiredPackingItems,
} from '@uaetrail/shared-types';
import {
  PACKING_LIST_TITLE,
  PACKING_MUST_LABEL,
  PACKING_NICE_LABEL,
  packingChipClassName,
} from '@/discovery/discoveryPortExploreCreateFlow';

type ActivityPackingListPreviewProps = {
  requirements?: string[] | null;
  className?: string;
  showTitle?: boolean;
};

export const ActivityPackingListPreview = ({
  requirements,
  className = '',
  showTitle = true,
}: ActivityPackingListPreviewProps) => {
  const packing = parsePackingList(requirements);
  if (packing.items.length === 0) return null;
  const must = requiredPackingItems(packing.items);
  const nice = optionalPackingItems(packing.items);
  const strict = packing.mode === 'strict';

  return (
    <div className={`rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 ${className}`}>
      {showTitle ? <p className="text-sm font-semibold text-emerald-950">{PACKING_LIST_TITLE}</p> : null}
      <p className={`${showTitle ? '' : ''} mb-3 text-xs text-emerald-900/75`}>
        {strict
          ? 'You will confirm must-haves and sign your name when you join.'
          : 'A suggested kit — no confirmation needed to join.'}
      </p>
      {must.length > 0 ? <PreviewGroup title={PACKING_MUST_LABEL} items={must} required /> : null}
      {nice.length > 0 ? <PreviewGroup title={PACKING_NICE_LABEL} items={nice} required={false} /> : null}
    </div>
  );
};

const PreviewGroup = ({
  title,
  items,
  required,
}: {
  title: string;
  items: PackingItem[];
  required: boolean;
}) => (
  <div className="mb-2 last:mb-0">
    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-900/60">{title}</p>
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item.id}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm ${packingChipClassName(required)}`}
        >
          <span aria-hidden>{item.emoji}</span>
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  </div>
);
