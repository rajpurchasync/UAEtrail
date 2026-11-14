import { useEffect, useState } from 'react';

/** Shared adults/kids for headcount mode in JoinRequestModal. */
type PartySize = { adults: number; kids: number };

let current: PartySize = { adults: 1, kids: 0 };
const listeners = new Set<() => void>();

export const getPartySize = (): PartySize => current;

export const setPartySize = (next: Partial<PartySize>): PartySize => {
  current = {
    adults: next.adults ?? current.adults,
    kids: next.kids ?? current.kids,
  };
  listeners.forEach((fn) => fn());
  return current;
};

export const useSharedPartySize = (): PartySize & {
  setAdults: (n: number) => void;
  setKids: (n: number) => void;
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
    setAdults: (n: number) => setPartySize({ adults: n }),
    setKids: (n: number) => setPartySize({ kids: n }),
  };
};
