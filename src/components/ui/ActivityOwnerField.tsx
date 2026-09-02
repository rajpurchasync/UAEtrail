import { useAuth } from '../../context/AuthContext';

type ActivityOwnerFieldProps = {
  ownerName?: string;
};

export const ActivityOwnerField = ({ ownerName }: ActivityOwnerFieldProps) => {
  const { user } = useAuth();
  const label = ownerName ?? user?.displayName ?? user?.email ?? 'You';

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">Owner</label>
      <input
        type="text"
        readOnly
        value={label}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700"
      />
    </div>
  );
};
