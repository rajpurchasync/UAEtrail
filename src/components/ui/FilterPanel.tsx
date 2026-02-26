interface FilterPanelProps {
  regions: string[];
  selectedRegions: string[];
  onRegionToggle: (region: string) => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  onClearFilters: () => void;
  children?: React.ReactNode;
}

export const FilterPanel = ({
  regions,
  selectedRegions,
  onRegionToggle,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
  children
}: FilterPanelProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-32">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        <button
          onClick={onClearFilters}
          className="text-sm text-emerald-600 hover:text-emerald-700"
        >
          Clear all
        </button>
      </div>

      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Location</h3>
        <div className="space-y-2">
          {regions.map((region) => (
            <label key={region} className="flex items-center">
              <input
                type="checkbox"
                checked={selectedRegions.includes(region)}
                onChange={() => onRegionToggle(region)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="ml-2 text-sm text-gray-700">{region}</span>
            </label>
          ))}
        </div>
      </div>

      {(onStartDateChange || onEndDateChange) && (
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Date Range</h3>
          <div className="space-y-3">
            {onStartDateChange && (
              <div>
                <label className="text-xs text-gray-600 mb-1 block">From</label>
                <input
                  type="date"
                  value={startDate || ''}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>
            )}
            {onEndDateChange && (
              <div>
                <label className="text-xs text-gray-600 mb-1 block">To</label>
                <input
                  type="date"
                  value={endDate || ''}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  );
};
