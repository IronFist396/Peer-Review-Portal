// lib/prisma.js
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: (() => {
          const base = process.env.DATABASE_URL || '';
          const sep = base.includes('?') ? '&' : '?';
          return `${base}${sep}connection_limit=10&pool_timeout=15`;
        })(),
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma