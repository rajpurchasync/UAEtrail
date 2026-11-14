import { useEffect, useState } from 'react';
import { setPartySize } from './partySizeState';

export type PartyJoinMode = 'me' | 'headcount' | 'team';

type PartyJoinIntent = {
  mode: PartyJoinMode;
  teamId: string | null;
  membershipIds: string[];
};

let current: PartyJoinIntent = { mode: 'me', teamId: null, membershipIds: [] };
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((fn) => fn());

export const resetPartyJoinIntent = (): void => {
  current = { mode: 'me', teamId: null, membershipIds: [] };
  setPartySize({ adults: 1, kids: 0 });
  notify();
};

export const setPartyJoinMode = (mode: PartyJoinMode): void => {
  current = { ...current, mode };
  if (mode === 'me') {
    current.membershipIds = [];
    current.teamId = null;
    setPartySize({ adults: 1, kids: 0 });
  }
  notify();
};

export const setPartyJoinTeam = (teamId: string | null, membershipIds: string[]): void => {
  current = { mode: 'team', teamId, membershipIds };
  notify();
};

export const getPartyJoinIntent = (): PartyJoinIntent => current;

export const usePartyJoinIntent = (): PartyJoinIntent & {
  setMode: (mode: PartyJoinMode) => void;
  setTeam: (teamId: string | null, membershipIds: string[]) => void;
  reset: () => void;
} => {
  const [value, setValue] = useState(current);
  useEffect(() => {
    const onChange = () => setValue({ ...current });
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);
  return {
    ...value,
    setMode: setPartyJoinMode,
    setTeam: setPartyJoinTeam,
    reset: resetPartyJoinIntent,
  };
};