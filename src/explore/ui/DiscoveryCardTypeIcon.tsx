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
  className = '',
}: DiscoveryCardTypeIconProps) => {
  const resolvedKind = kind ?? tone;
  const glyph = emoji ?? resolveMapPinEmoji(resolvedKind, source);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-emoji leading-none ${sizeClasses[size]} ${discoveryCardToneClass[tone]} ${className}`}
      aria-hidden
    >
      {glyph}
    </span>
  );
};
