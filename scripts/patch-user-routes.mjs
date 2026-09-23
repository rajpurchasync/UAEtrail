import fs from 'node:fs';

const file = 'apps/api/src/routes/user.ts';
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

const schemaImport = `import {
  createRequestSchema,
  eventIdParamSchema,
  hostDetailsSchema,
  listFilterSchema,
  pushSubscriptionSchema,
  requestIdParamSchema,
  rsvpSchema,
  userBriefParamSchema,
  userSearchSchema,
} from './user/schemas.js';
import { registerBuddyRoutes } from './user/registerBuddyRoutes.js';
import { registerGroupRoutes } from './user/registerGroupRoutes.js';
import { registerNotificationRoutes } from './user/registerNotificationRoutes.js';
import { registerProfileRoutes } from './user/registerProfileRoutes.js';`;

let result = [...lines.slice(0, 153), schemaImport, '', ...lines.slice(278)];

result = result.filter((line) => !line.startsWith('const userBriefParamSchema'));

const profileStart = result.findIndex((line) => line.startsWith("userRouter.get('/me/profile'"));
const pushSchemaIdx = result.findIndex((line) => line.startsWith('const pushSubscriptionSchema'));
if (profileStart < 0 || pushSchemaIdx < 0) {
  throw new Error(`Could not find splice markers: profile=${profileStart}, push=${pushSchemaIdx}`);
}

result.splice(
  profileStart,
  pushSchemaIdx - profileStart,
  'registerProfileRoutes(userRouter);',
  'registerNotificationRoutes(userRouter);',
  'registerBuddyRoutes(userRouter);',
  'registerGroupRoutes(userRouter);',
  ''
);

const userSearchIdx = result.findIndex((line) => line.startsWith('const userSearchSchema'));
if (userSearchIdx >= 0) {
  let end = userSearchIdx + 1;
  while (end < result.length && result[end].trim() !== '') end += 1;
  result.splice(userSearchIdx, end - userSearchIdx + 1);
}

const hostDetailsIdx = result.findIndex((line) => line.startsWith('const hostDetailsSchema'));
if (hostDetailsIdx >= 0) {
  let end = hostDetailsIdx;
  while (end < result.length && !result[end].startsWith('userRouter.patch')) end += 1;
  result.splice(hostDetailsIdx, end - hostDetailsIdx);
}

fs.writeFileSync(file, result.join('\n'));
console.log(`Patched ${file}: ${lines.length} -> ${result.length} lines`);
