import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PLAN_PATH } from '../constants';
import { useCreateFlow } from '../create/CreateFlowProvider';
import { clearPlanAddQuery, parsePlanAddQuery, setPlanAddQuery } from '../create/planAddQuery';
import { clearExploreComposeParams, seekFlexibleCompose } from '../explore/compose';
import { signInPathForReturn } from '../utils/authReturnContext';
import { useAuth } from '../context/AuthContext';
import type { PlanAddOptionId } from './planAdd';

/** Plan FAB launcher — trip/availability hand off to create session; goal/wishlist stay on Plan. */
export const usePlanAddFlow = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { compose } = useCreateFlow();
  const [searchParams, setSearchParams] = useSearchParams();
  const step = parsePlanAddQuery(searchParams);

  const patchPlanAdd = useCallback(
    (next: ReturnType<typeof parsePlanAddQuery>, tabWishlist = false) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          clearExploreComposeParams(params);
          if (!next) clearPlanAddQuery(params);
          else setPlanAddQuery(params, next);
          if (tabWishlist) {
            params.set('view', 'plans');
            params.set('tab', 'wishlist');
            params.delete('filter');
            params.delete('layout');
          }
          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const openMenu = useCallback(() => {
    if (!user) {
      navigate(signInPathForReturn(PLAN_PATH));
      return;
    }
    patchPlanAdd('menu');
  }, [navigate, patchPlanAdd, user]);

  const close = useCallback(() => {
    patchPlanAdd(null);
  }, [patchPlanAdd]);

  const selectOption = useCallback(
    (id: PlanAddOptionId) => {
      if (id === 'trip') {
        compose.handleCreateTap({ surface: 'menu', intent: 'host' });
        return;
      }
      if (id === 'availability') {
        compose.handleCreateTap(seekFlexibleCompose());
        return;
      }
      if (id === 'goal') {
        patchPlanAdd('goal', true);
        return;
      }
      patchPlanAdd('wishlist', true);
    },
    [compose, patchPlanAdd]
  );

  return {
    step,
    openMenu,
    close,
    selectOption,
  };
};
