import { useState } from 'react';
import { X } from 'lucide-react';
import {
  DEFAULT_RIDESHARE_RIDER_RULES,
  formatRideshareRiderRules,
  parseRideshareRiderRules,
} from './rideshareRiderRules';

type RideshareRiderRulesFieldProps = {
  value: string;
  onChange: (next: string) => void;
};

export const RideshareRiderRulesField = ({ value, onChange }: RideshareRiderRulesFieldProps) => {
  const [customRule, setCustomRule] = useState('');
  const lines = parseRideshareRiderRules(value);

  const setLines = (next: string[]) => onChange(formatRideshareRiderRules(next));

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const addCustomRule = () => {
    const trimmed = customRule.trim();
    if (!trimmed) return;
    const next = [...lines];
    if (!next.some((line) => line.toLowerCase() === trimmed.toLowerCase())) {
      next.push(trimmed);
    }
    setLines(next);
    setCustomRule('');
  };

  const addPreset = (preset: string) => {
    if (lines.some((line) => line.toLowerCase() === preset.toLowerCase())) return;
    setLines([...lines, preset]);
  };

  const missingPresets = DEFAULT_RIDESHARE_RIDER_RULES.filter(
    (preset) => !lines.some((line) => line.toLowerCase() === preset.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {lines.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {lines.map((line, index) => (
            <li key={`${line}-${index}`}>
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900">
                <span className="min-w-0">{line}</span>
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  className="shrink-0 rounded-full p-0.5 text-gray-500 hover:bg-neutral-100 hover:text-gray-800"
                  aria-label={`Remove rule: ${line}`}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">Add at least one rule riders should agree to.</p>
      )}

      {missingPresets.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {missingPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => addPreset(preset)}
              className="rounded-full border border-dashed border-neutral-300 bg-neutral-50 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:border-emerald-400 hover:bg-emerald-50/60"
            >
              + {preset}
            </button>
          ))}
        </div>
      ) : null}

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Add another rule
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            value={customRule}
            onChange={(event) => setCustomRule(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addCustomRule();
              }
            }}
            placeholder="e.g. Max 1 bag per person"
            className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-2.5 text-base text-gray-900 outline-none focus:border-emerald-500"
            maxLength={160}
          />
          <button
            type="button"
            onClick={addCustomRule}
            disabled={!customRule.trim()}
            className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </label>
    </div>
  );
};
