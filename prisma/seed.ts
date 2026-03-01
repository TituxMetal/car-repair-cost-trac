import { PrismaClient } from '../generated/prisma'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { seedDemoData } from '../server/demo-data'

// Load .env file for DATABASE_URL
try {
  process.loadEnvFile('.env')
} catch {
  // .env is optional
}

const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db'
const adapter = new PrismaLibSql({ url: databaseUrl })
const prisma = new PrismaClient({ adapter })

const main = async () => {
  console.log('🌱 Seeding database...')

  const result = await seedDemoData(prisma)

  console.log(`✅ Created vehicle: ${result.vehicle.make} ${result.vehicle.model}`)
  console.log(`✅ Created ${result.counts.events} maintenance events`)
  console.log(`✅ Created ${result.counts.expenses} expenses`)
  console.log(`✅ Created ${result.counts.reminders} reminders`)
  console.log('✅ Created monthly budget')
  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
