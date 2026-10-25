import { listMemberVehicles } from '../lib/member-vehicles-store.js';

export const listMyMemberVehicles = (userId: string) => listMemberVehicles(userId);
