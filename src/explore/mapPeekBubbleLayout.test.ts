import { describe, expect, it } from 'vitest';
import { layoutMapPeekBottomSheet, layoutMapPeekBubble, mapPeekFitScale } from './mapPeekBubbleLayout';

describe('layoutMapPeekBubble', () => {
  it('centers when the pin is unknown', () => {
    const layout = layoutMapPeekBubble({
      overlayWidth: 800,
      overlayHeight: 600,
      cardHeight: 300,
    });
    expect(layout.placement).toBe('center');
    expect(layout.left).toBeCloseTo((800 - layout.width) / 2);
  });

  it('uses the remaining viewport instead of a fixed height cap', () => {
    const layout = layoutMapPeekBubble({
      overlayWidth: 1280,
      overlayHeight: 900,
      cardHeight: 400,
      topInset: 72,
      bottomInset: 24,
    });
    expect(layout.maxHeight).toBe(900 - 72 - 24);
    expect(layout.maxHeight).toBeGreaterThan(700);
  });

  it('keeps the card below the toolbar inset', () => {
    const layout = layoutMapPeekBubble({
      overlayWidth: 1000,
      overlayHeight: 800,
      cardHeight: 500,
      pin: { x: 200, y: 40 },
      topInset: 80,
      bottomInset: 20,
    });
    expect(layout.top).toBeGreaterThanOrEqual(80);
    expect(layout.top + Math.min(500, layout.maxHeight)).toBeLessThanOrEqual(800 - 20 + 0.5);
  });

  it('prefers sitting above the pin when there is room', () => {
    const layout = layoutMapPeekBubble({
      overlayWidth: 1000,
      overlayHeight: 800,
      cardHeight: 280,
      pin: { x: 500, y: 500 },
    });
    expect(layout.placement).toBe('above');
    expect(layout.top + 280).toBeLessThan(500);
    expect(layout.originX).toBeGreaterThan(0);
    expect(layout.originY).toBeGreaterThan(0);
  });

  it('flips below the pin near the top edge', () => {
    const layout = layoutMapPeekBubble({
      overlayWidth: 1000,
      overlayHeight: 800,
      cardHeight: 280,
      pin: { x: 200, y: 40 },
    });
    expect(layout.placement).toBe('below');
    expect(layout.top).toBeGreaterThan(12);
  });

  it('stays inside the overlay near a corner', () => {
    const layout = layoutMapPeekBubble({
      overlayWidth: 400,
      overlayHeight: 500,
      cardHeight: 260,
      pin: { x: 8, y: 8 },
    });
    expect(layout.left).toBeGreaterThanOrEqual(12);
    expect(layout.top).toBeGreaterThanOrEqual(12);
    expect(layout.left + layout.width).toBeLessThanOrEqual(400 - 12 + 0.5);
  });
});

describe('layoutMapPeekBottomSheet', () => {
  it('docks the card above the bottom inset', () => {
    const layout = layoutMapPeekBottomSheet({
      overlayWidth: 390,
      overlayHeight: 800,
      cardHeight: 320,
      bottomInset: 96,
      topInset: 72,
    });
    expect(layout.placement).toBe('below');
    expect(layout.top + 320).toBeCloseTo(800 - 96, 0.5);
    expect(layout.width).toBe(390 - 24);
  });
});

describe('mapPeekFitScale', () => {
  it('stays at 1 when content already fits', () => {
    expect(mapPeekFitScale(280, 500)).toBe(1);
  });

  it('shrinks to the available overlay height', () => {
    expect(mapPeekFitScale(500, 400)).toBeCloseTo(0.8);
  });

  it('keeps shrinking until the card fits the overlay', () => {
    expect(mapPeekFitScale(2000, 200)).toBeCloseTo(0.1);
  });
});
