import { initialsFromName } from '../../utils/userDisplay';

interface InitialsAvatarProps {
  name: string;
  className?: string;
}

export const InitialsAvatar = ({ name, className = '' }: InitialsAvatarProps) => (
  <div
    className={`inline-flex items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-semibold select-none ${className}`}
    aria-hidden="true"
  >
    {initialsFromName(name)}
  </div>
);
