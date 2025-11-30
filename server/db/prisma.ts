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
 * Initialize the database by ensuring the directory exists and creating tables if needed.
 * This is important for Fly.io deployments where the /data volume needs to be initialized.
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
  
  // Use Prisma's db push to ensure schema is up to date
  // This creates tables if they don't exist
  try {
    const { execSync } = await import('child_process')
    console.log('🔄 Syncing database schema...')
    execSync(`bunx prisma db push`, {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: dbUrl }
    })
    console.log('✅ Database schema synced')
  } catch (err) {
    console.error('⚠️ Schema sync failed, tables may already exist:', err)
    // Continue - tables might already exist
  }
}

export default prisma
