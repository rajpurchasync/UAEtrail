/**
 * Backfill blood group, medical conditions, and emergency contact (incl. relation) for existing
 * auth_users. Only missing fields are filled; values a member already saved are kept.
 * Run: npm --workspace @uaetrail/api exec tsx scripts/backfill-member-medical-safety.ts
 */
import {
  BLOOD_GROUP_VALUES,
  EMERGENCY_CONTACT_RELATION_VALUES,
  MEDICAL_CONDITIONS_NA,
  isMedicalSafetyProfileComplete,
  type BloodGroup,
} from '@uaetrail/shared-types';
import { getMongoClient } from '../src/lib/mongo.js';
import { resolveCliScriptName, runCliScript } from './cli-script-runner.js';
import { medicalSafetyFieldsFromAuthProfile } from '../src/lib/member-medical-safety-profile.js';
import type { AuthUserRecord } from '../src/lib/auth-users-store.js';

const CONDITIONS = [
  MEDICAL_CONDITIONS_NA,
  'Mild asthma — carries inhaler',
  'Type 2 diabetes',
  'Seasonal allergies',
  'Previous knee surgery (2022)',
];

const NAMES = ['Ahmed Khan', 'Sara Ali', 'Omar Hassan', 'Fatima Noor', 'James Wright', 'Priya Nair'];

const randomItem = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];

const randomUaePhone = (): string => {
  const suffix = String(Math.floor(10_000_000 + Math.random() * 89_999_999));
  return `+9715${suffix.slice(0, 8)}`;
};

const main = async () => {
  const collection = getMongoClient()!.db().collection<AuthUserRecord>('auth_users');
  const docs = await collection.find({}).project({ _id: 1, profile: 1 }).toArray();

  let updated = 0;
  let skipped = 0;

  for (const doc of docs) {
    const existing = medicalSafetyFieldsFromAuthProfile(doc.profile);
    if (isMedicalSafetyProfileComplete(existing)) {
      skipped += 1;
      continue;
    }
    // Fill only what is missing — never overwrite a blood group or contact the member already saved.
    const existingBlood = existing.bloodGroup?.trim() as BloodGroup | undefined;
    const bloodGroup =
      existingBlood && BLOOD_GROUP_VALUES.includes(existingBlood)
        ? existingBlood
        : randomItem(BLOOD_GROUP_VALUES);
    const medicalConditions = existing.medicalConditions?.trim() || randomItem(CONDITIONS);
    const existingName = existing.emergencyContactName?.trim() ?? '';
    const existingPhone = existing.emergencyContactPhone?.trim() ?? '';
    const hasContact = existingName.length >= 2 && existingPhone.length >= 8;
    const emergencyContactName = hasContact ? existingName : randomItem(NAMES);
    const emergencyContactPhone = hasContact ? existingPhone : randomUaePhone();
    // Relation became mandatory after the first backfill: a saved contact without one gets the
    // neutral `Other` instead of a guessed relationship.
    const emergencyContactRelation =
      existing.emergencyContactRelation?.trim() ||
      (hasContact ? 'Other' : randomItem(EMERGENCY_CONTACT_RELATION_VALUES));
    await collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          'profile.bloodGroup': bloodGroup,
          'profile.medicalConditions': medicalConditions,
          'profile.emergencyContactName': emergencyContactName,
          'profile.emergencyContactPhone': emergencyContactPhone,
          'profile.emergencyContactRelation': emergencyContactRelation,
          updatedAt: new Date(),
        },
      }
    );
    updated += 1;
  }

  console.log(`backfill-member-medical-safety: updated=${updated} skipped=${skipped} total=${docs.length}`);
};

runCliScript(resolveCliScriptName(import.meta.url), main);
