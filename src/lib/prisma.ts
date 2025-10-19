import { PrismaClient } from '@prisma/client'

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

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
        db: {
            url: process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder'
        }
    },
    errorFormat: 'pretty'
}).$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                try {
                    return await query(args)
                } catch (error: any) {
                    // Database connection errors
                    if (error.code === 'P1001' || error.code === 'P1017') {
                        console.log(`Database connection error for ${model}.${operation}:`, error.message)
                        return []
                    }
                    // Table doesn't exist errors
                    if (error.code === 'P2021') {
                        console.log(`Table not found for ${model}.${operation}:`, error.message)
                        return []
                    }
                    throw error
                }
            }
        }
    }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma as any 