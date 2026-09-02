import type { RequestHandler, Router } from 'express';

type HttpMethod = 'get' | 'post' | 'patch' | 'delete' | 'put';

export const registerActivityRoute = (
  router: Router,
  method: HttpMethod,
  suffix: string,
  ...handlers: RequestHandler[]
): void => {
  router[method](`/activities${suffix}`, ...handlers);
};

export const mountActivityRoutes = (router: Router, subRouter: Router): void => {
  router.use('/activities', subRouter);
};
