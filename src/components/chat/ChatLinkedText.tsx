import type { MouseEvent, TouchEvent } from 'react';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { splitChatMessageLinks } from '../../utils/chatMessageLinks';

type ChatLinkedTextProps = {
  text: string;
  tone?: 'default' | 'onPrimary';
};

const stopLinkGesture = (event: MouseEvent | TouchEvent) => {
  event.stopPropagation();
};

/** Render chat body text with tappable http(s) / www URLs. */
export const ChatLinkedText = ({ text, tone = 'default' }: ChatLinkedTextProps) => {
  const segments = splitChatMessageLinks(text);
  const linkClass =
    tone === 'onPrimary'
      ? 'relative z-[1] pointer-events-auto break-all text-white underline decoration-white/80 underline-offset-2 hover:text-emerald-50'
      : 'relative z-[1] pointer-events-auto break-all text-emerald-800 underline decoration-emerald-600/70 underline-offset-2 hover:text-emerald-950';

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === 'text') {
          return <Fragment key={index}>{segment.value}</Fragment>;
        }

        if (segment.to) {
          return (
            <Link
              key={index}
              to={segment.to}
              className={linkClass}
              onClick={stopLinkGesture}
              onTouchStart={stopLinkGesture}
            >
              {segment.value}
            </Link>
          );
        }

        return (
          <a
            key={index}
            href={segment.href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
            onClick={stopLinkGesture}
            onTouchStart={stopLinkGesture}
          >
            {segment.value}
          </a>
        );
      })}
    </>
  );
};
