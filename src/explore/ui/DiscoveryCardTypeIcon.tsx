import type { DiscoveryCardKind, DiscoveryCardSource, DiscoveryCardTone } from '../../discovery/discoveryCardModel';
import { discoveryCardToneClass } from '../../discovery/discoveryCardModel';
import { resolveMapPinEmoji } from '../exploreCopy';

interface DiscoveryCardTypeIconProps {
  tone: DiscoveryCardTone;
  source?: DiscoveryCardSource;
  kind?: DiscoveryCardKind;
  /** Prefer presentation emoji; falls back to map pin resolver. */
  emoji?: string;
  size?: 'sm' | 'md' | 'overlay';
  /** Emoji only — no colored circle (venue list photo chrome). */
  bare?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-11 w-11 text-[1.35rem]',
  md: 'h-12 w-12 text-[1.5rem]',
  overlay: 'h-7 w-7 text-base',
} as const;

/** Colored circle with type emoji — matches filter chips and map pins. */
export const DiscoveryCardTypeIcon = ({
  tone,
  source = 'activity',
  kind,
  emoji,
  size = 'md',
  bare = false,
  className = '',
}: DiscoveryCardTypeIconProps) => {
  const resolvedKind = kind ?? tone;
  const glyph = emoji ?? resolveMapPinEmoji(resolvedKind, source);
  if (bare) {
    return (
      <span
        className={`inline-block shrink-0 font-emoji text-[1.375rem] leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,.8)] ${className}`}
        aria-hidden
      >
        {glyph}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center font-emoji leading-none ${sizeClasses[size]} rounded-full ${discoveryCardToneClass[tone]} ${className}`}
      aria-hidden
    >
      {glyph}
    </span>
  );
};
