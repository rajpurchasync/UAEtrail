import type { ActivityPeekParticipationWidget } from '../../../../activity/resolveActivityPeekParticipationWidget';

const toneClass = (tone: ActivityPeekParticipationWidget['tone']) => {
  switch (tone) {
    case 'host':
      return 'bg-violet-100 text-violet-900';
    case 'joined':
      return 'bg-emerald-100 text-emerald-900';
    case 'waitlist':
      return 'bg-sky-100 text-sky-900';
    case 'pending':
      return 'bg-amber-100 text-amber-900';
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
};

export const PeekParticipationBadge = ({ widget }: { widget: ActivityPeekParticipationWidget }) => (
  <span
    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClass(widget.tone)}`}
    data-peek-participation={widget.tone}
  >
    {widget.label}
  </span>
);