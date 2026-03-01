// lib/prisma.js
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: `${process.env.DATABASE_URL}?connection_limit=10&pool_timeout=15`,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma