import { useMemo, useState } from 'react';
import type { CommunityJoinPolicy } from '@uaetrail/shared-types';
import { Dialog } from '@/components/ui/Dialog';
import { AppSelect } from '@/components/ui/AppSelect';
import {
  buildDefaultCreateCommunityBody,
  COMMUNITY_CREATE_EMIRATE_OPTIONS,
  slugifyCommunityName,
} from '@/config/communityDiscoverDefaults';
import { communityJoinPolicyLabel } from '@/content/communityDiscoverCopy';
import { useCreateDiscoverableCommunity } from '@/crew-discovery/hooks/useMeCommunityDiscoverList';

const JOIN_OPTIONS: { value: CommunityJoinPolicy; label: string }[] = [
  { value: 'open', label: communityJoinPolicyLabel('open') },
  { value: 'request', label: communityJoinPolicyLabel('request') },
  { value: 'invite', label: communityJoinPolicyLabel('invite') },
];

export const CreateCommunityDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const mutation = useCreateDiscoverableCommunity();
  const [name, setName] = useState('');
  const [summary, setSummary] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [emirateKey, setEmirateKey] = useState(COMMUNITY_CREATE_EMIRATE_OPTIONS[0]?.key ?? 'Dubai');
  const [joinPolicy, setJoinPolicy] = useState<CommunityJoinPolicy>('request');

  const slugPreview = useMemo(() => slugifyCommunityName(name || 'your-club'), [name]);

  const reset = () => {
    setName('');
    setSummary('');
    setBannerUrl('');
    setEmirateKey(COMMUNITY_CREATE_EMIRATE_OPTIONS[0]?.key ?? 'Dubai');
    setJoinPolicy('request');
  };

  const onSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed || mutation.isPending) return;
    mutation.mutate(
      buildDefaultCreateCommunityBody(trimmed, joinPolicy, {
        summary,
        bannerUrl,
        emirateKey,
      }),
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!mutation.isPending) {
          onClose();
        }
      }}
      title="Create community"
    >
      <p className="mb-4 text-sm text-neutral-600">
        Discoverable clubs live on the map. You host the page — private teams stay separate.
      </p>
      <label className="block text-sm font-medium text-neutral-900">
        Community name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Dubai weekend hikers"
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
        />
      </label>
      <p className="mt-2 text-xs text-neutral-500">URL: /clubs/{slugPreview || '…'}</p>
      <label className="mt-4 block text-sm font-medium text-neutral-900">
        Short summary
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          placeholder="One line so people know your vibe"
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
        />
      </label>
      <label className="mt-4 block text-sm font-medium text-neutral-900">
        Banner image URL
        <input
          type="url"
          value={bannerUrl}
          onChange={(e) => setBannerUrl(e.target.value)}
          placeholder="https://…"
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm"
        />
      </label>
      <div className="mt-4">
        <p className="mb-1 text-sm font-medium text-neutral-900">Primary emirate</p>
        <AppSelect
          value={emirateKey}
          onChange={(value) => setEmirateKey(value)}
          options={COMMUNITY_CREATE_EMIRATE_OPTIONS.map((row) => ({ value: row.key, label: row.label }))}
          aria-label="Primary emirate"
        />
      </div>
      <div className="mt-4">
        <p className="mb-1 text-sm font-medium text-neutral-900">Who can join</p>
        <AppSelect
          value={joinPolicy}
          onChange={(value) => setJoinPolicy(value as CommunityJoinPolicy)}
          options={JOIN_OPTIONS}
          aria-label="Who can join"
        />
      </div>
      {mutation.isError ? (
        <p className="mt-3 text-sm text-red-600">Could not create community. Try a different name.</p>
      ) : null}
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() => onClose()}
          className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-neutral-800"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={mutation.isPending || !name.trim()}
          onClick={onSubmit}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {mutation.isPending ? 'Publishing…' : 'Publish community'}
        </button>
      </div>
    </Dialog>
  );
};