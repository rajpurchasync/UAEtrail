import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role:
    | 'platform_admin'
    | 'tenant_owner'
    | 'tenant_admin'
    | 'tenant_guide'
    | 'visitor';
}

export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions['expiresIn']
  });

export const signRefreshToken = (payload: Pick<AccessTokenPayload, 'sub' | 'email'>): string =>
  jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: `${env.JWT_REFRESH_TTL_DAYS}d` });

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;

export const verifyRefreshToken = (token: string): Pick<AccessTokenPayload, 'sub' | 'email'> =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as Pick<AccessTokenPayload, 'sub' | 'email'>;
