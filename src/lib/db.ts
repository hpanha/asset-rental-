import { PrismaClient } from '@/lib/prisma-client-v6'

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  'postgresql://postgres:tocomputer@localhost:5432/asset-rental?schema=public'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  })

globalForPrisma.prisma = db

export default db
