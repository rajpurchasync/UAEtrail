import { FEATURE_FLAGS } from '@/config/platform';
import { useMeCommunityDiscoverList } from '@/crew-discovery/hooks/useMeCommunityDiscoverList';

type HostingCommunityPublishFieldProps = {
  value: string | null;
  onChange: (communityId: string | null) => void;
  disabled?: boolean;
};

/** Optional club tag on publish — shows outings under the community page (`discoverCommunityId`). */
export const HostingCommunityPublishField = ({
  value,
  onChange,
  disabled,
}: HostingCommunityPublishFieldProps) => {
  const { data, isPending } = useMeCommunityDiscoverList();

  if (!FEATURE_FLAGS.communityDiscover) return null;

  const options = data?.created ?? [];
  if (!isPending && options.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-neutral-200 bg-white px-3 py-3">
      <label htmlFor="hosting-community-pick" className="text-sm font-medium text-neutral-900">
        Tag a community (optional)
      </label>
      <p className="mt-1 text-xs text-neutral-600">
        Shows this outing on your club page under Outings — only for communities you host.
      </p>
      <select
        id="hosting-community-pick"
        disabled={disabled || isPending}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value.trim() ? e.target.value : null)}
        className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 disabled:opacity-60"
      >
        <option value="">No community</option>
        {options.map((row) => (
          <option key={row.id} value={row.id}>
            {row.name}
          </option>
        ))}
      </select>
    </div>
  );
};