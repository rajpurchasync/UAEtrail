import { ChevronDown, Pencil } from 'lucide-react';
import { ReactNode } from 'react';
import { GlassCard } from '../mobile/GlassCard';
import { SecureAvatar } from '../ui/SecureAvatar';

interface AccountIdentityBarProps {
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  roleLabel: string;
  bio?: string | null;
  phone?: string | null;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  editLabel?: string;
  extra?: ReactNode;
  children?: ReactNode;
  onAvatarClick?: () => void;
}

export const AccountIdentityBar = ({
  displayName,
  email,
  avatarUrl,
  roleLabel,
  bio,
  phone,
  expanded,
  onToggle,
  onEdit,
  editLabel = 'Edit profile',
  extra,
  children,
  onAvatarClick,
}: AccountIdentityBarProps) => (
  <GlassCard padding className="mb-3 !p-3 animate-fade-up">
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggle();
        }
      }}
      className="w-full flex items-center gap-3 text-left active:opacity-80"
      aria-expanded={expanded}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onAvatarClick?.();
        }}
        className="relative shrink-0"
        aria-label="Open notifications"
      >
        <SecureAvatar
          src={avatarUrl}
          name={displayName}
          className="w-11 h-11 text-sm ring-2 ring-white/80"
        />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[15px] font-semibold text-neutral-900 truncate">{displayName}</p>
          {extra}
        </div>
        <p className="text-xs text-neutral-500 truncate">{email}</p>
      </div>
      <span className="hidden sm:inline text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-600/10 text-emerald-700 capitalize shrink-0">
        {roleLabel}
      </span>
      <ChevronDown
        className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
      />
    </div>

    {expanded && (
      <div className="mt-3 pt-3 border-t border-neutral-100/80 space-y-2.5 animate-fade-in">
        <div className="flex flex-wrap items-center gap-2">
          <span className="sm:hidden text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-600/10 text-emerald-700 capitalize">
            {roleLabel}
          </span>
          {phone && <span className="text-xs text-neutral-500">{phone}</span>}
        </div>
        {bio ? (
          <p className="text-sm text-neutral-600 leading-relaxed">{bio}</p>
        ) : (
          <p className="text-sm text-neutral-400 italic">No bio yet</p>
        )}
        {children}
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600"
        >
          <Pencil className="w-3.5 h-3.5" />
          {editLabel}
        </button>
      </div>
    )}
  </GlassCard>
);
