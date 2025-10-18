import { PrismaClient } from '@prisma/client'

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// KALICI ÇÖZÜM: Prisma 5.x stable client
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 