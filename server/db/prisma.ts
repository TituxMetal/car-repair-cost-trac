import { PrismaClient } from '../../generated/prisma'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'

const dbUrl = process.env.DATABASE_URL || 'file:prisma/dev.db'
const adapter = new PrismaLibSql({ url: dbUrl })

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Initialize the database by ensuring the directory exists.
 * In production, we rely on the database schema being set up during Docker build.
 * The Prisma client will create the database file on first connection if it doesn't exist.
 */
export async function initDatabase(): Promise<void> {
  // Extract file path from DATABASE_URL (format: file:/path/to/db)
  const urlMatch = dbUrl.match(/^file:(.+)$/)
  if (urlMatch) {
    const dbPath = urlMatch[1]
    const dbDir = dirname(dbPath)
    
    // Ensure the database directory exists
    if (!existsSync(dbDir)) {
      console.log(`📁 Creating database directory: ${dbDir}`)
      mkdirSync(dbDir, { recursive: true })
    }
    
    // Check if database file exists
    if (!existsSync(dbPath)) {
      console.log(`🗄️ Database file not found at ${dbPath}, will be created on first connection`)
    }
  }
  
  // In production, skip runtime schema sync to avoid OOM issues on constrained environments.
  // Schema should be applied during Docker build or manually before first deploy.
  // For development, you can run `bun run db:push` manually.
  console.log('✅ Database initialization complete')
}

export default prisma
