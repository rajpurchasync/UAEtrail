/**
 * Backfill blood group, medical conditions, and emergency contact for existing auth_users.
 * Run: npm --workspace @uaetrail/api exec tsx scripts/backfill-member-medical-safety.ts
 */
import {
  BLOOD_GROUP_VALUES,
  MEDICAL_CONDITIONS_NA,
  isMedicalSafetyProfileComplete,
} from '@uaetrail/shared-types';
import { connectMongo, getMongoClient } from '../src/lib/mongo.js';
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
  await connectMongo();
  const collection = getMongoClient()!.db().collection<AuthUserRecord>('auth_users');
  const docs = await collection.find({}).project({ _id: 1, profile: 1 }).toArray();

  let updated = 0;
  let skipped = 0;

  for (const doc of docs) {
    if (isMedicalSafetyProfileComplete(medicalSafetyFieldsFromAuthProfile(doc.profile))) {
      skipped += 1;
      continue;
    }
    const bloodGroup = randomItem(BLOOD_GROUP_VALUES);
    const medicalConditions = randomItem(CONDITIONS);
    const emergencyContactName = randomItem(NAMES);
    const emergencyContactPhone = randomUaePhone();
    await collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          'profile.bloodGroup': bloodGroup,
          'profile.medicalConditions': medicalConditions,
          'profile.emergencyContactName': emergencyContactName,
          'profile.emergencyContactPhone': emergencyContactPhone,
          updatedAt: new Date(),
        },
      }
    );
    updated += 1;
  }

  console.log(`backfill-member-medical-safety: updated=${updated} skipped=${skipped} total=${docs.length}`);
  process.exit(0);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
