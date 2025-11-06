import { PrismaClient } from '@prisma/client'

let withAccelerate: any = null
try {
    // Optional: only if dependency exists
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    withAccelerate = require('@prisma/extension-accelerate').withAccelerate
} catch { }

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// KALICI ÇÖZÜM: Prisma 6.x stable client with error handling
if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL environment variable is not set. Using placeholder URL.')
}

// Optimize connection string for Neon pooled connections
const databaseUrl = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder'
// Ensure connection pooling parameters for Neon
const optimizedUrl = databaseUrl.includes('pooler') && !databaseUrl.includes('connection_limit')
    ? `${databaseUrl}${databaseUrl.includes('?') ? '&' : '?'}connection_limit=1&pool_timeout=10`
    : databaseUrl

const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
        db: {
            url: optimizedUrl
        }
    },
    errorFormat: 'pretty'
})

const client = withAccelerate
    ? (baseClient as any).$extends(withAccelerate())
    : baseClient

// CRITICAL FIX: Always reuse global instance in production to avoid cold starts
export const prisma = globalForPrisma.prisma ?? (client as PrismaClient)

// Always cache in global to prevent re-initialization
if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prisma as any
} 