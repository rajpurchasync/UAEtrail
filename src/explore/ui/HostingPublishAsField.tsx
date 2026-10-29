import type { OwnedHostProfileDTO } from '@uaetrail/shared-types';
import { AppSelect } from '../../components/ui/AppSelect';
import { EXPLORE_SHAPE } from '../../config/exploreTheme';
import { hostingPublishAsLabel } from '../hostingPublishTenants';

type HostingPublishAsFieldProps = {
  options: OwnedHostProfileDTO[];
  value: string;
  onChange: (tenantId: string) => void;
  memberDisplayName?: string | null;
  disabled?: boolean;
};

/** Shown on Host publish step when the member has multiple activity host tenants. */
export const HostingPublishAsField = ({
  options,
  value,
  onChange,
  memberDisplayName,
  disabled,
}: HostingPublishAsFieldProps) => {
  if (options.length <= 1) return null;

  return (
    <div className="mt-4 border-t border-neutral-200 pt-4">
      <label htmlFor="organize-publish-as" className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        Publish as
      </label>
      <AppSelect
        className="mt-2 w-full"
        value={value}
        disabled={disabled}
        options={options.map((profile) => ({
          value: profile.tenantId,
          label: hostingPublishAsLabel(profile, memberDisplayName),
        }))}
        onChange={onChange}
        inputClassName={`w-full ${EXPLORE_SHAPE.control} border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900`}
        aria-label="Publish as"
      />
    </div>
  );
};
