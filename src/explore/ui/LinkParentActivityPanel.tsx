import { useState } from 'react';
import { Link2 } from 'lucide-react';
import {
  HOSTING_LINK_PARENT_ACTIVITY_HINT,
  HOSTING_LINK_PARENT_EMPTY,
  HOSTING_LINK_PARENT_PASTE_LABEL,
  HOSTING_LINK_PARENT_PASTE_PLACEHOLDER,
  HOSTING_LINK_PARENT_PICK_LABEL,
  HOSTING_LINK_PARENT_SUBMIT,
} from '../createFlowCopy';
import { linkParentToRideshareActivity, linkRideshareToParentActivityFromPaste } from '../linkActivityRideshareOffer';
import { useEligibleRideshareParentActivities } from '../../hooks/useEligibleRideshareParentActivities';
import type { RideshareParentCandidate } from '../eligibleRideshareParentActivities';

type LinkParentActivityPanelProps = {
  tenantId: string;
  rideshareActivityId: string;
  onLinked?: (parentActivityId: string) => void;
  onError?: (message: string) => void;
};

const relationLabel = (relation: RideshareParentCandidate['relation']): string =>
  relation === 'hosting' ? 'Hosting' : 'Joined';

/** Ride host — pick a joined/hosted outing or paste a parent link. */
export const LinkParentActivityPanel = ({
  tenantId,
  rideshareActivityId,
  onLinked,
  onError,
}: LinkParentActivityPanelProps) => {
  const { candidates, loading } = useEligibleRideshareParentActivities({
    enabled: true,
    tenantId,
    excludeActivityId: rideshareActivityId,
  });
  const [pasteValue, setPasteValue] = useState('');
  const [linkingId, setLinkingId] = useState<string | null>(null);

  const handleLinkSelected = async (parentId: string) => {
    setLinkingId(parentId);
    try {
      await linkParentToRideshareActivity(tenantId, parentId, rideshareActivityId);
      onLinked?.(parentId);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Could not link outing.');
    } finally {
      setLinkingId(null);
    }
  };

  const handlePasteLink = async () => {
    setLinkingId('paste');
    try {
      const parentId = await linkRideshareToParentActivityFromPaste(
        tenantId,
        rideshareActivityId,
        pasteValue
      );
      setPasteValue('');
      onLinked?.(parentId);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Could not link outing.');
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-3 sm:px-4">
      <p className="text-sm font-semibold text-gray-900">Link to an outing</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-600">{HOSTING_LINK_PARENT_ACTIVITY_HINT}</p>

      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {HOSTING_LINK_PARENT_PICK_LABEL}
      </p>
      {loading ? (
        <p className="mt-2 text-sm text-neutral-500">Loading your outings…</p>
      ) : candidates.length === 0 ? (
        <p className="mt-2 text-sm leading-snug text-neutral-600">{HOSTING_LINK_PARENT_EMPTY}</p>
      ) : (
        <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto overscroll-contain">
          {candidates.map((row) => {
            const busy = linkingId === row.id;
            return (
              <li key={row.id}>
                <button
                  type="button"
                  disabled={Boolean(linkingId)}
                  onClick={() => void handleLinkSelected(row.id)}
                  className="flex w-full min-w-0 items-start justify-between gap-2 rounded-xl border border-transparent bg-white/80 px-3 py-2 text-left hover:border-sky-200 disabled:opacity-60"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-neutral-900">{row.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-neutral-500">
                      {[row.date, row.locationName].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                      {relationLabel(row.relation)}
                    </span>
                    <span className="text-xs font-semibold text-sky-800">{busy ? 'Linking…' : 'Link'}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <label className="mt-3 block">
        <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <Link2 className="h-3.5 w-3.5" aria-hidden />
          {HOSTING_LINK_PARENT_PASTE_LABEL}
        </span>
        <input
          type="url"
          value={pasteValue}
          onChange={(event) => setPasteValue(event.target.value)}
          placeholder={HOSTING_LINK_PARENT_PASTE_PLACEHOLDER}
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
        {linkingId === 'paste' ? 'Linking…' : HOSTING_LINK_PARENT_SUBMIT}
      </button>
    </div>
  );
};
