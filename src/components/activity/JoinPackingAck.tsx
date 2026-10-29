import type { PackingAckMode, PackingItem } from '@uaetrail/shared-types';
import { optionalPackingItems, packingItemDisplay, requiredPackingItems } from '@uaetrail/shared-types';
import {
  PACKING_LIST_TITLE,
  PACKING_MUST_LABEL,
  PACKING_NICE_LABEL,
  PACKING_SIGNATURE_HINT,
  PACKING_SIGNATURE_LABEL,
} from '../../explore/createFlowCopy';

type JoinPackingAckProps = {
  mode: PackingAckMode;
  items: PackingItem[];
  checkedIds: string[];
  signature: string;
  onToggle: (id: string, checked: boolean) => void;
  onSignatureChange: (value: string) => void;
};

export const JoinPackingAck = ({
  mode,
  items,
  checkedIds,
  signature,
  onToggle,
  onSignatureChange,
}: JoinPackingAckProps) => {
  if (items.length === 0) return null;
  const must = requiredPackingItems(items);
  const nice = optionalPackingItems(items);
  const strict = mode === 'strict';
  const checked = new Set(checkedIds);
  const mustDone = must.filter((item) => checked.has(item.id)).length;

  return (
    <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
      <div>
        <p className="text-sm font-semibold text-emerald-950">{PACKING_LIST_TITLE}</p>
        <p className="text-xs text-emerald-900/80">
          {strict
            ? must.length
              ? `Tick all ${must.length} must-haves (${mustDone}/${must.length}), then sign with your full name.`
              : 'Sign with your full name to confirm you have read the kit list.'
            : 'Suggested kit — you can join without ticking anything.'}
        </p>
      </div>
      {must.length > 0 ? (
        <PackingAckGroup
          title={PACKING_MUST_LABEL}
          hint={strict ? 'Required to join' : undefined}
          items={must}
          interactive={strict}
          checked={checked}
          onToggle={onToggle}
        />
      ) : null}
      {nice.length > 0 ? (
        <PackingAckGroup
          title={PACKING_NICE_LABEL}
          hint={strict ? 'Optional — tick if you are bringing it' : undefined}
          items={nice}
          interactive={strict}
          checked={checked}
          onToggle={onToggle}
        />
      ) : null}
      {strict ? (
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-emerald-950">{PACKING_SIGNATURE_LABEL}</span>
          <p className="mb-2 text-xs text-emerald-900/80">{PACKING_SIGNATURE_HINT}</p>
          <input
            value={signature}
            onChange={(event) => onSignatureChange(event.target.value)}
            autoComplete="name"
            placeholder="First and last name"
            className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm text-neutral-900"
            maxLength={80}
          />
        </label>
      ) : null}
    </div>
  );
};

const PackingAckGroup = ({
  title,
  hint,
  items,
  interactive,
  checked,
  onToggle,
}: {
  title: string;
  hint?: string;
  items: PackingItem[];
  interactive: boolean;
  checked: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
}) => (
  <div>
    <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-900/70">{title}</p>
    {hint ? <p className="mb-1.5 text-[11px] text-emerald-900/65">{hint}</p> : null}
    <ul className="space-y-1.5">
      {items.map((item) =>
        interactive ? (
          <li key={item.id}>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white/80 px-3 py-2">
              <input
                type="checkbox"
                checked={checked.has(item.id)}
                onChange={(event) => onToggle(item.id, event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-emerald-600"
              />
              <span className="text-sm text-neutral-900">{packingItemDisplay(item)}</span>
            </label>
          </li>
        ) : (
          <li key={item.id} className="flex gap-2 px-1 text-sm text-neutral-800">
            <span aria-hidden>{item.emoji}</span>
            <span>{item.label}</span>
          </li>
        )
      )}
    </ul>
  </div>
);
