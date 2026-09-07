interface MobileAgeRangeSliderProps {
  minAge: number;
  maxAge: number;
  onChange: (minAge: number, maxAge: number) => void;
  min?: number;
  max?: number;
}

/** Dual-handle age range selector for join settings. */
export const MobileAgeRangeSlider = ({
  minAge,
  maxAge,
  onChange,
  min = 5,
  max = 80,
}: MobileAgeRangeSliderProps) => {
  const handleMin = (value: number) => {
    const next = Math.min(value, maxAge - 1);
    onChange(next, maxAge);
  };

  const handleMax = (value: number) => {
    const next = Math.max(value, minAge + 1);
    onChange(minAge, next);
  };

  const minPercent = ((minAge - min) / (max - min)) * 100;
  const maxPercent = ((maxAge - min) / (max - min)) * 100;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
        <span aria-hidden>🎂</span>
        Age range
      </div>
      <div className="relative h-8">
        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-neutral-200" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-rose-500"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={minAge}
          onChange={(event) => handleMin(Number(event.target.value))}
          className="pointer-events-auto absolute inset-x-0 top-0 h-8 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-20 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:shadow-md"
          aria-label="Minimum age"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={maxAge}
          onChange={(event) => handleMax(Number(event.target.value))}
          className="pointer-events-auto absolute inset-x-0 top-0 h-8 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-20 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:shadow-md"
          aria-label="Maximum age"
        />
      </div>
      <div className="mt-2 flex justify-between text-xs font-semibold text-gray-600">
        <span>{minAge <= min ? `${minAge} onwards` : minAge}</span>
        <span>{maxAge >= max ? `${max}+` : maxAge}</span>
      </div>
    </div>
  );
};
