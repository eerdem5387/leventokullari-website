import { PrismaClient } from '@prisma/client'

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// KALICI ÇÖZÜM: Minimal Prisma client - cache sorununu çöz
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 