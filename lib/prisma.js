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

// Normalize emails to lowercase across the app.
// - Ensures new/updated users are stored with lowercase emails
// - Makes common user lookups resilient to email case
prisma.$use(async (params, next) => {
  if (params.model !== 'User') {
    return next(params)
  }

  const lower = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value)

  // Normalize write payloads
  if (params.action === 'create' || params.action === 'update') {
    if (params.args?.data?.email) {
      params.args.data.email = lower(params.args.data.email)
    }
  }

  if (params.action === 'createMany') {
    const data = params.args?.data
    if (Array.isArray(data)) {
      for (const record of data) {
        if (record?.email) record.email = lower(record.email)
      }
    } else if (data?.email) {
      data.email = lower(data.email)
    }
  }

  if (params.action === 'updateMany') {
    if (params.args?.data?.email) {
      params.args.data.email = lower(params.args.data.email)
    }
    if (params.args?.where?.email) {
      params.args.where.email = lower(params.args.where.email)
    }
  }

  if (params.action === 'upsert') {
    if (params.args?.create?.email) {
      params.args.create.email = lower(params.args.create.email)
    }
    if (params.args?.update?.email) {
      params.args.update.email = lower(params.args.update.email)
    }
    if (params.args?.where?.email) {
      params.args.where.email = lower(params.args.where.email)
    }
  }

  // Normalize common lookups
  if (params.action === 'findUnique' || params.action === 'findFirst' || params.action === 'delete') {
    if (params.args?.where?.email) {
      params.args.where.email = lower(params.args.where.email)
    }
  }

  return next(params)
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma