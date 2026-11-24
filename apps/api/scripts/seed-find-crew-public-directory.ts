import { findAuthUserByEmail, updateAuthUserProfile } from '../src/lib/auth-users-store.js';

const FIND_CREW_PUBLIC_DIRECTORY_DEMO_EMAILS = [
  'guide@uaetrails.app',
  'host@uaetrails.app',
  'visitor@uaetrails.app',
  'organizer@uaetrails.app',
  'visitor2@uaetrails.app',
] as const;

/** Ensures demo users appear in guest Find crew directory + Professional guides rail. */
export const runFindCrewPublicDirectorySeed = async (): Promise<void> => {
  let updated = 0;
  for (const email of FIND_CREW_PUBLIC_DIRECTORY_DEMO_EMAILS) {
    const user = await findAuthUserByEmail(email);
    if (!user) continue;
    await updateAuthUserProfile(user._id, {
      profileVisibility: 'public',
      findCrewVisibility: 'friends_of_friends',
    });
    updated += 1;
  }
  if (updated > 0) {
    console.log(`[seed] Find crew public directory: ${updated} demo member profile(s) set to public browse`);
  }
};