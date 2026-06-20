import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';

export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'production'
    ? [{ emit: 'stdout', level: 'error' }]
    : [{ emit: 'stdout', level: 'query' }, { emit: 'stdout', level: 'error' }, { emit: 'stdout', level: 'warn' }],
  datasourceUrl: env.DATABASE_URL
});
