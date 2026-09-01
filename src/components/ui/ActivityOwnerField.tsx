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
      <p className="w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-800">{label}</p>
      <p className="text-xs text-gray-500 mt-1">Person who created this activity.</p>
    </div>
  );
};
