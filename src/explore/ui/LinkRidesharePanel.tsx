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
  /** Flat body when nested inside ConsumerDetailSection (no nested sky card). */
  embedded?: boolean;
};

export const LinkRidesharePanel = ({
  tenantId,
  parentActivityId,
  onCreateRideshare,
  onLinked,
  onError,
  variant = 'full',
  embedded = false,
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
    <div
      className={
        embedded
          ? 'min-w-0 space-y-3'
          : 'min-w-0 space-y-3 overflow-hidden rounded-xl border border-neutral-200 bg-white px-3 py-3 shadow-sm sm:px-4 dark:border-neutral-700 dark:bg-neutral-900'
      }
    >
      {!embedded ? (
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {HOSTING_OFFER_RIDESHARE_LABEL}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
            {HOSTING_LINK_RIDESHARE_HINT}
          </p>
        </div>
      ) : (
        <p className="text-sm leading-snug text-neutral-700 dark:text-neutral-200">
          {HOSTING_LINK_RIDESHARE_HINT}
        </p>
      )}

      {showPicker ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {HOSTING_LINK_RIDESHARE_PICK_LABEL}
          </p>
          {loading ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading your rides…</p>
          ) : candidates.length === 0 ? (
            <p className="text-sm leading-snug text-neutral-600 dark:text-neutral-300">
              {HOSTING_LINK_RIDESHARE_EMPTY}
            </p>
          ) : (
            <ul className="max-h-40 space-y-1.5 overflow-y-auto overscroll-contain">
              {candidates.map((row) => {
                const busy = linkingId === row.id;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      disabled={Boolean(linkingId)}
                      onClick={() => void handleLinkRide(row.id)}
                      className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-left hover:border-sky-300 hover:bg-sky-50/60 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950 dark:hover:border-sky-700 dark:hover:bg-sky-950/40"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          {row.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-neutral-500 dark:text-neutral-400">
                          {[row.date, row.locationName].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-sky-800 dark:text-sky-300">
                        {busy ? 'Linking…' : 'Link'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {showCreate ? (
        <button
          type="button"
          onClick={onCreateRideshare}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-sm font-bold text-white hover:bg-sky-700"
        >
          <Car className="h-4 w-4" aria-hidden />
          {HOSTING_LINK_RIDESHARE_CREATE}
        </button>
      ) : null}

      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          <Link2 className="h-3.5 w-3.5" aria-hidden />
          {HOSTING_LINK_RIDESHARE_PASTE_LABEL}
        </span>
        <input
          type="url"
          value={pasteValue}
          onChange={(event) => setPasteValue(event.target.value)}
          placeholder={HOSTING_LINK_RIDESHARE_PASTE_PLACEHOLDER}
          className="w-full min-w-0 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-sky-400 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          autoComplete="off"
        />
      </label>
      <button
        type="button"
        disabled={Boolean(linkingId) || !pasteValue.trim()}
        onClick={() => void handlePasteLink()}
        className="w-full rounded-xl border border-sky-200 bg-white py-2.5 text-sm font-semibold text-sky-900 disabled:opacity-50 dark:border-sky-800 dark:bg-neutral-950 dark:text-sky-200"
      >
        {linkingId === 'paste' ? 'Linking…' : 'Link rideshare'}
      </button>
    </div>
  );
};
