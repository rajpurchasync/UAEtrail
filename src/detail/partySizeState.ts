import { useEffect, useState } from 'react';

/** Shared adults/kids so the desktop aside and JoinRequestModal stay in sync. */
type PartySize = { adults: number; kids: number };

let current: PartySize = { adults: 1, kids: 0 };
const listeners = new Set<() => void>();

/** Mobile detail: party chosen in sheet — hide duplicate pickers in JoinRequestModal once. */
let skipPartySizeInJoinModal = false;

export const markPartySizeChosenForJoinModal = (): void => {
  skipPartySizeInJoinModal = true;
};

export const consumeSkipPartySizeInJoinModal = (): boolean => {
  const skip = skipPartySizeInJoinModal;
  skipPartySizeInJoinModal = false;
  return skip;
};

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
