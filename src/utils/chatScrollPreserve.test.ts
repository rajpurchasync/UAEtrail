import { describe, expect, it, vi } from 'vitest';
import { applyChatScrollPreserveAnchor } from './chatScrollPreserve';

describe('applyChatScrollPreserveAnchor', () => {
  it('keeps the same messages in view when height grows above', () => {
    const container = {
      scrollHeight: 2000,
      scrollTop: 0,
    } as HTMLElement;

    applyChatScrollPreserveAnchor(container, {
      scrollHeight: 1000,
      scrollTop: 120,
      anchorOffset: 0,
      anchorSelector: null,
    });

    expect(container.scrollTop).toBe(1120);
  });

  it('shifts by how far the anchored message moved, not by a second jump', () => {
    const container = document.createElement('div');
    const anchorEl = document.createElement('div');
    anchorEl.setAttribute('data-dm-message-id', 'm1');
    container.appendChild(anchorEl);
    let scrollTop = 40;
    Object.defineProperty(container, 'scrollTop', {
      configurable: true,
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = value;
      },
    });
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({ top: 80 } as DOMRect);
    vi.spyOn(anchorEl, 'getBoundingClientRect').mockReturnValue({ top: 480 } as DOMRect);

    applyChatScrollPreserveAnchor(container, {
      scrollHeight: 1000,
      scrollTop: 40,
      anchorOffset: 20,
      anchorSelector: '[data-dm-message-id="m1"]',
    });

    expect(container.scrollTop).toBe(420);
  });
});
