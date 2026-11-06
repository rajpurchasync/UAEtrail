import fs from 'node:fs';

const path = 'src/explore/ui/hostingFlowEngine.ts';
const src = fs.readFileSync(path, 'utf8');
const start = src.indexOf('export type CreateActivityKind');
const end = src.indexOf('export const resolveLimitedAudienceAccess');
const typesBlock = src.slice(start, end);
const header = `import type {
  ActivityGroupChatPostPolicy,
  PackingAckMode,
  PackingItem,
  RideshareDestinationKind,
} from '@uaetrail/shared-types';
import type { CountryCode } from '../../config/regions';
import type { ParticipationMode } from '../compose';
import type {
  ActivityDifficulty,
  LocationPrecision,
  TimeMode,
} from './createFlowShared';

export type { ParticipationMode } from '../compose';
export type {
  ActivityDifficulty,
  LocationPrecision,
  TimeMode,
} from './createFlowShared';

`;

fs.writeFileSync('src/explore/ui/hostingFlowDraftTypes.ts', header + typesBlock);
const newSrc =
  src.slice(0, start) +
  "export type {\n  CreateActivityKind,\n  CreateFlowStepId,\n  JoinMode,\n  AudienceAccess,\n  VehicleAccess,\n  PriceMode,\n  PlaceLabelSource,\n  ActivityHostingTopic,\n  CreateActivityDraft,\n} from './hostingFlowDraftTypes.js';\n\n" +
  src.slice(end);
fs.writeFileSync(path, newSrc.replace(/^import type \{[\s\S]*?from '\.\/createFlowShared';\n/m, '').replace(/^export type \{ ParticipationMode \}[\s\S]*?from '\.\/createFlowShared';\n/gm, ''));
console.log('hosting types split');
