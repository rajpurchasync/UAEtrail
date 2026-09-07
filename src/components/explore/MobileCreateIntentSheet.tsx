import { ChevronRight, HandHeart, Plus, X } from 'lucide-react';

interface MobileCreateIntentSheetProps {
  open: boolean;
  onClose: () => void;
  onChoose: (choice: 'add' | 'request') => void;
}

const INTENT_OPTIONS = [
  {
    key: 'add' as const,
    title: 'Add',
    subtitle: 'Post a hike, camp, event, or carpool',
    icon: Plus,
    iconWrap: 'bg-rose-500 text-white shadow-md shadow-rose-500/30',
    card: 'border-rose-200 bg-gradient-to-br from-rose-50 to-white active:border-rose-400',
    label: 'text-rose-700',
  },
  {
    key: 'request' as const,
    title: 'Request',
    subtitle: 'Tell the community what you want to do and find a match',
    icon: HandHeart,
    iconWrap: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30',
    card: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white active:border-emerald-400',
    label: 'text-emerald-700',
  },
];

export const MobileCreateIntentSheet = ({ open, onClose, onChoose }: MobileCreateIntentSheetProps) => {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-[1400] flex flex-col justify-end bg-black/40">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative rounded-t-[28px] bg-white px-5 pb-[calc(var(--safe-bottom)+4.5rem)] pt-3 shadow-[0_-8px_40px_rgba(15,23,42,0.12)]">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-neutral-200" />

        <div className="relative mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 pr-8">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">I am looking to…</h2>
            <p className="mt-1 text-sm leading-snug text-gray-500">
              Share something for others to join, or ask the community for a plan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-0 top-0 rounded-full p-2 text-gray-400 hover:bg-neutral-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          {INTENT_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onChoose(option.key)}
                className={`flex w-full items-center gap-4 rounded-2xl border-2 px-4 py-4 text-left transition ${option.card}`}
              >
                <span
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${option.iconWrap}`}
                >
                  <Icon className="h-7 w-7" strokeWidth={2.25} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-lg font-bold ${option.label}`}>{option.title}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-gray-600">{option.subtitle}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" aria-hidden />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
