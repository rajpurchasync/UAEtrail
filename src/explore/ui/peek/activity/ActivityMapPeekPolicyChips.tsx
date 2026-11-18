import { Baby, PawPrint, Users, UserRound, type LucideIcon } from 'lucide-react';
import { EXPLORE_PEEK } from '../../../../config/exploreTheme';

const policyIcon = (label: string): LucideIcon => {
  const key = label.toLowerCase();
  if (/pet|dog|animal/i.test(key)) return PawPrint;
  if (/women|female/i.test(key)) return UserRound;
  if (/child|kid|family|parent/i.test(key)) return Baby;
  return Users;
};

/** Audience / requirements — only pills that apply on this outing. */
export const ActivityMapPeekPolicyChips = ({ labels }: { labels: string[] }) => {
  if (labels.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1" aria-label="Outing rules and audience">
      {labels.map((label) => {
        const Icon = policyIcon(label);
        return (
          <li
            key={label}
            className={`${EXPLORE_PEEK.tripPolicyChip} bg-neutral-100 text-neutral-800`}
            title={label}
          >
            <Icon className="h-3 w-3 shrink-0 opacity-75" strokeWidth={2.25} aria-hidden />
            <span className="truncate">{label}</span>
          </li>
        );
      })}
    </ul>
  );
};