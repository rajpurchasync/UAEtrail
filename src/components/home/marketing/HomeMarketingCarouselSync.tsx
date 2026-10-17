import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode
} from 'react';
import { HERO_CAROUSEL_AUTOPLAY_MS } from './heroCarouselTypes';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';

type ClockSubscriber = {
  shouldRun: () => boolean;
  onTick: () => void;
};

type HomeMarketingCarouselSyncContextValue = {
  registerClockSubscriber: (id: symbol, subscriber: ClockSubscriber) => () => void;
};

const HomeMarketingCarouselSyncContext = createContext<HomeMarketingCarouselSyncContextValue | null>(
  null
);

export const HomeMarketingCarouselSyncProvider = ({ children }: { children: ReactNode }) => {
  const reducedMotion = usePrefersReducedMotion();
  const subscribersRef = useRef(new Map<symbol, ClockSubscriber>());

  const registerClockSubscriber = useCallback((id: symbol, subscriber: ClockSubscriber) => {
    subscribersRef.current.set(id, subscriber);
    return () => subscribersRef.current.delete(id);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const tick = () => {
      subscribersRef.current.forEach((subscriber) => {
        if (subscriber.shouldRun()) subscriber.onTick();
      });
    };

    const timer = window.setInterval(tick, HERO_CAROUSEL_AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const value = useMemo(() => ({ registerClockSubscriber }), [registerClockSubscriber]);

  return (
    <HomeMarketingCarouselSyncContext.Provider value={value}>
      {children}
    </HomeMarketingCarouselSyncContext.Provider>
  );
};

export const useHomeMarketingCarouselSync = () => {
  const ctx = useContext(HomeMarketingCarouselSyncContext);
  if (!ctx) {
    throw new Error('useHomeMarketingCarouselSync must be used within HomeMarketingCarouselSyncProvider');
  }
  return ctx;
};

/** Shared 5.5s clock; each carousel opts in with its own shouldRun (pause, hover, overflow, etc.). */
export const useMarketingCarouselClock = (onTick: () => void, shouldRun: boolean) => {
  const { registerClockSubscriber } = useHomeMarketingCarouselSync();
  const onTickRef = useRef(onTick);
  const shouldRunRef = useRef(shouldRun);
  const idRef = useRef(Symbol('carousel-clock'));

  onTickRef.current = onTick;
  shouldRunRef.current = shouldRun;

  useEffect(() => {
    const id = idRef.current;
    return registerClockSubscriber(id, {
      shouldRun: () => shouldRunRef.current,
      onTick: () => onTickRef.current()
    });
  }, [registerClockSubscriber]);
};
