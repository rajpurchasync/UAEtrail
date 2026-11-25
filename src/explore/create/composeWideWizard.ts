import type { AddFlowStepId } from '../ui/addFlow';
import type { CreateFlowStepId } from '../ui/hostingFlowEngine';
import type { AvailabilityFixedFlowStepId } from '../ui/intentFixedFlowEngine';

/** Wider compose dialog on tablet/desktop single-page forms. */
export const COMPOSE_WIDE_SHEET_MAX_WIDTH = 'md:max-w-2xl lg:max-w-3xl';

/** Map pickers, photo upload, and publish/review stay one screen each (even on wide). */
const HOSTING_SOLO = new Set<string>([
  'meeting_point',
  'where',
  'to',
  'route',
  'meeting',
  'publish',
]);

const SEEKING_SOLO = new Set<string>([
  'curatedDestination',
  'destination',
  'to',
  'from',
  'area',
  'route',
  'review',
]);

const ADD_SOLO = new Set<string>(['location', 'image', 'review']);

/**
 * Tablet/desktop: one scrollable page with all non-solo fields, then solo steps in flow order.
 * Mobile callers pass through one step per page.
 */
export const bundleComposeFormPages = <T extends string>(
  steps: readonly T[],
  solo: ReadonlySet<string>
): T[][] => {
  const formSteps = steps.filter((step) => !solo.has(step));
  const pages: T[][] = [];
  if (formSteps.length > 0) pages.push([...formSteps]);
  for (const step of steps) {
    if (solo.has(step)) pages.push([step]);
  }
  if (pages.length === 0) return steps.map((step) => [step]);
  return pages;
};

export const bundleHostingWizardPages = (steps: readonly CreateFlowStepId[]): CreateFlowStepId[][] =>
  bundleComposeFormPages(steps, HOSTING_SOLO);

export const bundleAvailabilityWizardPages = (steps: readonly AvailabilityFixedFlowStepId[]): AvailabilityFixedFlowStepId[][] =>
  bundleComposeFormPages(steps, SEEKING_SOLO);

export const bundleAddWizardPages = (steps: readonly AddFlowStepId[]): AddFlowStepId[][] =>
  bundleComposeFormPages(steps, ADD_SOLO);

export const wizardPageContaining = <T extends string>(pages: readonly T[][], step: T): T[] =>
  pages.find((page) => page.includes(step)) ?? [step];
