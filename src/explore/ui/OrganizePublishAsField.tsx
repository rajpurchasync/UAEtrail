import type { OwnedHostProfileDTO } from '@uaetrail/shared-types';
import { organizePublishAsLabel } from '../organizePublishTenants';

type OrganizePublishAsFieldProps = {
  options: OwnedHostProfileDTO[];
  value: string;
  onChange: (tenantId: string) => void;
  memberDisplayName?: string | null;
  disabled?: boolean;
};

/** Shown on Organize publish step when the member has multiple activity host tenants. */
export const OrganizePublishAsField = ({
  options,
  value,
  onChange,
  memberDisplayName,
  disabled,
}: OrganizePublishAsFieldProps) => {
  if (options.length <= 1) return null;

  return (
    <div className="mt-4 border-t border-neutral-200 pt-4">
      <label htmlFor="organize-publish-as" className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Publish as
      </label>
      <select
        id="organize-publish-as"
        className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-gray-900"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((profile) => (
          <option key={profile.tenantId} value={profile.tenantId}>
            {organizePublishAsLabel(profile, memberDisplayName)}
          </option>
        ))}
      </select>
    </div>
  );
};
