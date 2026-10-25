import { useState } from 'react';
import { Link2 } from 'lucide-react';
import {
  HOSTING_LINK_PARENT_ACTIVITY_HINT,
  HOSTING_LINK_PARENT_PASTE_LABEL,
  HOSTING_LINK_PARENT_PASTE_PLACEHOLDER,
  HOSTING_LINK_PARENT_SUBMIT,
} from '../createFlowCopy';
import { linkRideshareToParentActivityFromPaste } from '../linkActivityRideshareOffer';

type LinkParentActivityPanelProps = {
  tenantId: string;
  rideshareActivityId: string;
  onLinked?: (parentActivityId: string) => void;
  onError?: (message: string) => void;
};

/** Host on rideshare detail — attach this ride to a parent outing by URL. */
export const LinkParentActivityPanel = ({
  tenantId,
  rideshareActivityId,
  onLinked,
  onError,
}: LinkParentActivityPanelProps) => {
  const [pasteValue, setPasteValue] = useState('');
  const [linking, setLinking] = useState(false);

  const handlePasteLink = async () => {
    setLinking(true);
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
      setLinking(false);
    }
  };

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-3 sm:px-4">
      <p className="text-sm font-semibold text-gray-900">Link to group outing</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-600">{HOSTING_LINK_PARENT_ACTIVITY_HINT}</p>
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
        disabled={linking || !pasteValue.trim()}
        onClick={() => void handlePasteLink()}
        className="mt-2 w-full rounded-xl border border-sky-200 bg-white py-2.5 text-sm font-semibold text-sky-800 disabled:opacity-50"
      >
        {linking ? 'Linking…' : HOSTING_LINK_PARENT_SUBMIT}
      </button>
    </div>
  );
};
