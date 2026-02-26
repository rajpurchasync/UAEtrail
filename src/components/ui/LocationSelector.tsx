import { X, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LocationSelectorProps {
  onClose: () => void;
}

const UAE_REGIONS = [
  { name: 'Abu Dhabi', query: 'Abu Dhabi' },
  { name: 'Dubai', query: 'Dubai' },
  { name: 'Sharjah', query: 'Sharjah' },
  { name: 'Ajman', query: 'Dubai' },
  { name: 'Fujairah', query: 'Fujairah' },
  { name: 'Ras Al Khaimah', query: 'RAK' },
  { name: 'Umm Al Quwain', query: 'Dubai' },
  { name: 'Al Ain', query: 'Al Ain' }
];

export const LocationSelector = ({ onClose }: LocationSelectorProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Find a Spot Near You</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-6">Select your region to discover nearby trails and camping spots</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {UAE_REGIONS.map((region) => (
              <Link
                key={region.name}
                to={`/discovery?region=${region.query}`}
                onClick={onClose}
                className="bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-lg p-4 transition-all group"
              >
                <div className="flex items-center justify-center mb-2">
                  <MapPin className="w-8 h-8 text-emerald-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-center font-medium text-gray-900">{region.name}</div>
              </Link>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t">
            <Link
              to="/discovery"
              onClick={onClose}
              className="block w-full text-center py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              View All Locations
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
