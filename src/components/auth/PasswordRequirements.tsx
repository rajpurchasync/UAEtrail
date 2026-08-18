import { Check, Circle } from 'lucide-react';
import { PASSWORD_REQUIREMENTS } from '../../utils/passwordPolicy';

interface PasswordRequirementsProps {
  password: string;
  className?: string;
}

export const PasswordRequirements = ({ password, className = '' }: PasswordRequirementsProps) => (
  <ul className={`space-y-1 ${className}`} aria-label="Password requirements">
    {PASSWORD_REQUIREMENTS.map((rule) => {
      const met = rule.test(password);
      return (
        <li key={rule.id} className={`flex items-center gap-2 text-xs ${met ? 'text-emerald-700' : 'text-gray-500'}`}>
          {met ? (
            <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
          ) : (
            <Circle className="w-3.5 h-3.5 shrink-0 text-gray-300" strokeWidth={2} aria-hidden />
          )}
          <span>{rule.label}</span>
        </li>
      );
    })}
  </ul>
);
