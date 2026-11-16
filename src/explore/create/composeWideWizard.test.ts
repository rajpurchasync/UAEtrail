import { describe, expect, it } from 'vitest';
import {
  bundleAddWizardPages,
  bundleHostingWizardPages,
  bundleAvailabilityWizardPages,
} from './composeWideWizard';

describe('composeWideWizard', () => {
  it('puts all hiking form fields on one tablet/desktop page; map and publish stay solo', () => {
    expect(
      bundleHostingWizardPages([
        'title',
        'when',
        'destination',
        'meeting_point',
        'audience',
        'spots',
        'price',
        'difficulty',
        'about_trail',
        'join_kit',
        'transportation',
        'meeting',
        'publish',
      ])
    ).toEqual([
      [
        'title',
        'when',
        'destination',
        'audience',
        'spots',
        'price',
        'difficulty',
        'about_trail',
        'join_kit',
        'transportation',
      ],
      ['meeting_point'],
      ['meeting'],
      ['publish'],
    ]);
  });

  it('bundles seeking form fields; map and review stay solo', () => {
    expect(
      bundleAvailabilityWizardPages([
        'title',
        'when',
        'curatedArea',
        'persons',
        'audience',
        'from',
        'info',
        'transport',
        'review',
      ])
    ).toEqual([
      ['title', 'when', 'persons', 'audience', 'info', 'transport'],
      ['curatedArea'],
      ['destination'],
      ['from'],
      ['review'],
    ]);
  });

  it('bundles add form fields; location, image, and review stay solo', () => {
    expect(
      bundleAddWizardPages([
        'title',
        'curatedArea',
        'location',
        'description',
        'parking',
        'image',
        'review',
      ])
    ).toEqual([
      ['title', 'curatedArea', 'description', 'parking'],
      ['location'],
      ['image'],
      ['review'],
    ]);
  });
});
