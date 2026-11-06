import { useState } from 'react';
import { Car, Link2 } from 'lucide-react';
import {
  HOSTING_LINK_RIDESHARE_CREATE,
  HOSTING_LINK_RIDESHARE_EMPTY,
  HOSTING_LINK_RIDESHARE_HINT,
  HOSTING_OFFER_RIDESHARE_LABEL,
  HOSTING_LINK_RIDESHARE_PASTE_LABEL,
  HOSTING_LINK_RIDESHARE_PASTE_PLACEHOLDER,
  HOSTING_LINK_RIDESHARE_PICK_LABEL,
} from '../createFlowCopy';
import { linkParentToRideshareActivity, parseActivityIdFromShareInput } from '../linkActivityRideshareOffer';
import { useEligibleSelfRideshares } from '../../hooks/useEligibleRideshareParentActivities';

type LinkRidesharePanelProps = {
  tenantId: string;
  parentActivityId: string;
  onCreateRideshare?: () => void;
  onLinked?: () => void;
  onError?: (message: string) => void;
  /** `pickExisting` = success popup (no extra wizard). `full` keeps create on manage sheets. */
  variant?: 'full' | 'pasteOnly' | 'pickExisting';
};

export const LinkRidesharePanel = ({
  tenantId,
  parentActivityId,
  onCreateRideshare,
  onLinked,
  onError,
  variant = 'full',
}: LinkRidesharePanelProps) => {
  const showPicker = variant !== 'pasteOnly';
  const showCreate = variant === 'full' && Boolean(onCreateRideshare);
  const { candidates, loading } = useEligibleSelfRideshares({
    enabled: showPicker,
    tenantId,
    parentActivityId,
  });
  const [pasteValue, setPasteValue] = useState('');
  const [linkingId, setLinkingId] = useState<string | null>(null);

  const handleLinkRide = async (rideshareId: string) => {
    setLinkingId(rideshareId);
    try {
      await linkParentToRideshareActivity(tenantId, parentActivityId, rideshareId);
      onLinked?.();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Could not link rideshare.');
    } finally {
      setLinkingId(null);
    }
  };

  const handlePasteLink = async () => {
    const rideshareId = parseActivityIdFromShareInput(pasteValue);
    if (!rideshareId) {
      onError?.('Paste a valid activity link or ID.');
      return;
    }
    setLinkingId('paste');
    try {
      await linkParentToRideshareActivity(tenantId, parentActivityId, rideshareId);
      setPasteValue('');
      onLinked?.();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Could not link rideshare.');
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-3 sm:px-4">
      <p className="text-sm font-semibold text-gray-900">{HOSTING_OFFER_RIDESHARE_LABEL}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-600">{HOSTING_LINK_RIDESHARE_HINT}</p>

      {showPicker ? (
        <>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {HOSTING_LINK_RIDESHARE_PICK_LABEL}
          </p>
          {loading ? (
            <p className="mt-2 text-sm text-neutral-500">Loading your rides…</p>
          ) : candidates.length === 0 ? (
            <p className="mt-2 text-sm leading-snug text-neutral-600">{HOSTING_LINK_RIDESHARE_EMPTY}</p>
          ) : (
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto overscroll-contain">
              {candidates.map((row) => {
                const busy = linkingId === row.id;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      disabled={Boolean(linkingId)}
                      onClick={() => void handleLinkRide(row.id)}
                      className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-transparent bg-white/80 px-3 py-2 text-left hover:border-sky-200 disabled:opacity-60"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-neutral-900">{row.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-neutral-500">
                          {[row.date, row.locationName].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-sky-800">
                        {busy ? 'Linking…' : 'Link'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : null}

      {showCreate ? (
        <button
          type="button"
          onClick={onCreateRideshare}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-sm font-bold text-white"
        >
          <Car className="h-4 w-4" aria-hidden />
          {HOSTING_LINK_RIDESHARE_CREATE}
        </button>
      ) : null}

      <label className="mt-3 block">
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
        disabled={Boolean(linkingId) || !pasteValue.trim()}
        onClick={() => void handlePasteLink()}
        className="mt-2 w-full rounded-xl border border-sky-200 bg-white py-2.5 text-sm font-semibold text-sky-800 disabled:opacity-50"
      >
        {linkingId === 'paste' ? 'Linking…' : 'Link rideshare'}
      </button>
    </div>
  );
};
