import { useCallback, useEffect, useState } from 'react';

/** Shared adults/kids for headcount mode in JoinRequestModal. */
type PartySize = { adults: number; kids: number };

let current: PartySize = { adults: 1, kids: 0 };
const listeners = new Set<() => void>();

export const getPartySize = (): PartySize => current;

export const setPartySize = (next: Partial<PartySize>): PartySize => {
  const adults = next.adults ?? current.adults;
  const kids = next.kids ?? current.kids;
  if (adults === current.adults && kids === current.kids) {
    return current;
  }
  current = { adults, kids };
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
  const setAdults = useCallback((n: number) => setPartySize({ adults: n }), []);
  const setKids = useCallback((n: number) => setPartySize({ kids: n }), []);

  return {
    ...value,
    setAdults,
    setKids,
  };
};
