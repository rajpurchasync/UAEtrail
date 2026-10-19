import { useState } from 'react';
import { Car, Link2 } from 'lucide-react';
import {
  HOSTING_LINK_RIDESHARE_CREATE,
  HOSTING_LINK_RIDESHARE_HINT,
  HOSTING_OFFER_RIDESHARE_LABEL,
  HOSTING_LINK_RIDESHARE_PASTE_LABEL,
  HOSTING_LINK_RIDESHARE_PASTE_PLACEHOLDER,
} from '../createFlowCopy';
import { linkParentToRideshareActivity, parseActivityIdFromShareInput } from '../linkActivityRideshareOffer';

type LinkRidesharePanelProps = {
  tenantId: string;
  parentActivityId: string;
  onCreateRideshare: () => void;
  onLinked?: () => void;
  onError?: (message: string) => void;
  /** Paste-only block — for linking additional published rideshares by URL. */
  variant?: 'full' | 'pasteOnly';
};

export const LinkRidesharePanel = ({
  tenantId,
  parentActivityId,
  onCreateRideshare,
  onLinked,
  onError,
  variant = 'full',
}: LinkRidesharePanelProps) => {
  const [pasteValue, setPasteValue] = useState('');
  const [linking, setLinking] = useState(false);

  const handlePasteLink = async () => {
    const rideshareId = parseActivityIdFromShareInput(pasteValue);
    if (!rideshareId) {
      onError?.('Paste a valid activity link or ID.');
      return;
    }
    setLinking(true);
    try {
      await linkParentToRideshareActivity(tenantId, parentActivityId, rideshareId);
      setPasteValue('');
      onLinked?.();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Could not link rideshare.');
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-3 sm:px-4">
      {variant === 'full' ? (
        <>
          <p className="text-sm font-semibold text-gray-900">{HOSTING_OFFER_RIDESHARE_LABEL}</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">{HOSTING_LINK_RIDESHARE_HINT}</p>
          <button
            type="button"
            onClick={onCreateRideshare}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-sm font-bold text-white"
          >
            <Car className="h-4 w-4" aria-hidden />
            {HOSTING_LINK_RIDESHARE_CREATE}
          </button>
        </>
      ) : null}

      <label className={variant === 'full' ? 'mt-4 block' : 'block'}>
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <Link2 className="h-3.5 w-3.5" aria-hidden />
          {HOSTING_LINK_RIDESHARE_PASTE_LABEL}
        </span>
        <input
          type="url"
          value={pasteValue}
          onChange={(event) => setPasteValue(event.target.value)}
          placeholder={HOSTING_LINK_RIDESHARE_PASTE_PLACEHOLDER}
          className="w-full min-w-0 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-sky-400"
          autoComplete="off"
        />
      </label>
      <button
        type="button"
        disabled={linking || !pasteValue.trim()}
        onClick={() => void handlePasteLink()}
        className="mt-2 w-full rounded-xl border border-sky-200 bg-white py-2.5 text-sm font-semibold text-sky-800 disabled:opacity-50"
      >
        {linking ? 'Linking…' : 'Link rideshare'}
      </button>
    </div>
  );
};
