import { expect } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

export const completeTestSignupProfile = async (app: Express, accessToken: string): Promise<void> => {
  const res = await request(app)
    .patch('/api/me/profile/signup-details')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      dateOfBirth: '1990-01-15',
      gender: 'prefer_not_to_say',
      countryCode: 'AE',
    });
  expect(res.status).toBe(200);
  expect(res.body.data.signupProfileComplete).toBe(true);
};

export const completeTestGuideProfile = async (app: Express, accessToken: string): Promise<void> => {
  const res = await request(app)
    .patch('/api/me/profile')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      bio: 'Integration test guide — weekend hiker hosting small groups.',
      languages: 'English',
      guideExperience: '3+ years hiking in the UAE.',
    });
  expect(res.status).toBe(200);
};

/** Signup + guide ladder for community publish gates (MIG-SCHEDULE-GUIDE). */
export const completeTestMemberPublishProfile = async (
  app: Express,
  accessToken: string
): Promise<void> => {
  await completeTestSignupProfile(app, accessToken);
  await completeTestGuideProfile(app, accessToken);
};