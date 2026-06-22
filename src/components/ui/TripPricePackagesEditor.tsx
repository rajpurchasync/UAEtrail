import { Plus, Trash2 } from 'lucide-react';
import { TRIP_CURRENCIES, TripPricePackage, emptyPricePackage } from '../../utils/tripPricing';

interface TripPricePackagesEditorProps {
  packages: TripPricePackage[];
  onChange: (packages: TripPricePackage[]) => void;
}

export const TripPricePackagesEditor = ({ packages, onChange }: TripPricePackagesEditorProps) => {
  const rows = packages.length > 0 ? packages : [emptyPricePackage()];

  const updateRow = (index: number, patch: Partial<TripPricePackage>) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange(next);
  };

  const addRow = () => onChange([...rows, emptyPricePackage()]);

  const removeRow = (index: number) => {
    if (rows.length <= 1) {
      onChange([emptyPricePackage()]);
      return;
    }
    onChange(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 leading-relaxed">
        Add one or more join options — e.g. bring your own (free), with food, with activities. Pick a currency and
        enter the amount as a number.
      </p>
      {rows.map((row, index) => (
        <div key={index} className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <div className="flex-1 min-w-0">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Package</label>
            <input
              type="text"
              value={row.label}
              onChange={(e) => updateRow(index, { label: e.target.value })}
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
              placeholder="e.g. With food & drinks"
            />
          </div>
          <div className="w-full sm:w-28">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Currency</label>
            <select
              value={row.currency}
              onChange={(e) => updateRow(index, { currency: e.target.value as TripPricePackage['currency'] })}
              className="w-full border rounded-xl px-3 py-2.5 text-sm bg-white"
            >
              {TRIP_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-28">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Amount</label>
            <input
              type="number"
              min={0}
              value={row.amount}
              onChange={(e) => updateRow(index, { amount: Number(e.target.value) || 0 })}
              className="w-full border rounded-xl px-3 py-2.5 text-sm"
              placeholder="0"
            />
          </div>
          <button
            type="button"
            onClick={() => removeRow(index)}
            className="p-2.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 self-end"
            aria-label="Remove package"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800"
      >
        <Plus className="w-4 h-4" />
        Add another option
      </button>
    </div>
  );
};
