import { Check, Circle } from 'lucide-react';
import { PASSWORD_REQUIREMENTS } from '../../utils/passwordPolicy';

interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

export const PasswordRequirements = ({ password, className = '' }: PasswordRequirementsProps) => (
  <ul className={`grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2 ${className}`} aria-label="Password requirements">
    {PASSWORD_REQUIREMENTS.map((rule) => {
      const met = rule.test(password);
      return (
        <li
          key={rule.id}
          className={`flex items-center gap-2 text-xs ${
            met ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-500 dark:text-neutral-500'
          }`}
        >
          {met ? (
            <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
          ) : (
            <Circle className="w-3.5 h-3.5 shrink-0 text-gray-300 dark:text-neutral-600" strokeWidth={2} aria-hidden />
          )}
          <span>{rule.label}</span>
        </li>
      );
    })}
  </ul>
);
